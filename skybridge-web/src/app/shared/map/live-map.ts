import { Component, ElementRef, OnDestroy, afterNextRender, effect, inject, input, output, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { LiveFlight } from '../../core/public/public.models';
import { ClientConfigService } from '../../core/config/client-config.service';
import { ThemeService } from '../../core/theme/theme.service';
import { flightKey } from '../live/live-flight';
import { ATTRIBUTION, PRIMARY, tileUrl } from './map-tiles';
import { nearestLongitude } from './route-map';

const PLANE = 'M12 2c.8 0 1.3.9 1.3 2v5.2l7.7 4.6v2l-7.7-2.4v4.8l2.2 1.7V21l-3.5-1-3.5 1v-1.1l2.2-1.7v-4.8L3 15.8v-2l7.7-4.6V4c0-1.1.5-2 1.3-2z';
const BRAZIL: L.LatLngTuple = [-15, -50];

@Component({
  selector: 'sb-live-map',
  host: { class: 'block' },
  template: `<div #map class="h-full w-full" data-testid="live-map"></div>`
})
export class LiveMap implements OnDestroy {
  readonly flights = input<LiveFlight[]>([]);
  readonly selected = input<string | null>(null);
  readonly compact = input(false);
  readonly selectedChange = output<string>();

  private readonly theme = inject(ThemeService);
  private readonly config = inject(ClientConfigService);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private readonly ready = signal(false);
  private readonly layers = L.layerGroup();
  private map?: L.Map;
  private tiles?: L.TileLayer;
  private fitted = false;

  constructor() {
    afterNextRender(() => {
      const compact = this.compact();
      this.map = L.map(this.container().nativeElement, {
        zoomControl: !compact,
        attributionControl: true,
        scrollWheelZoom: !compact,
        worldCopyJump: true,
        zoomSnap: 0.25
      }).setView(BRAZIL, 4);
      this.layers.addTo(this.map);
      this.ready.set(true);
    });

    effect(() => {
      const theme = this.theme.theme();
      const key = this.config.cartoApiKey();
      if (!this.ready() || !this.map) return;
      this.tiles?.remove();
      this.tiles = L.tileLayer(tileUrl(theme, key), { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(this.map);
    });

    effect(() => {
      const flights = this.flights();
      const selected = this.selected();
      this.theme.theme();
      if (!this.ready() || !this.map) return;
      this.render(flights, selected);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private render(flights: LiveFlight[], selected: string | null): void {
    const dark = this.theme.theme() === 'dark';
    const muted = dark ? '#a1a1aa' : '#52525b';
    const fill = dark ? '#0a0a0b' : '#ffffff';
    const idle = dark ? '#f4f4f5' : '#0a0a0b';
    const compact = this.compact();
    this.layers.clearLayers();

    const ordered = [...flights].sort((a, b) => Number(flightKey(a) === selected) - Number(flightKey(b) === selected));
    const bounds: L.LatLngTuple[] = [];

    for (const flight of ordered) {
      const key = flightKey(flight);
      const isSelected = key === selected;
      const color = isSelected ? PRIMARY : muted;
      const here: L.LatLngTuple = [flight.latitude, flight.longitude];
      bounds.push(here);

      if (flight.origin) {
        const origin: L.LatLngTuple = [flight.origin.latitude, nearestLongitude(flight.longitude, flight.origin.longitude)];
        bounds.push(origin);
        L.polyline([origin, here], { color, weight: isSelected ? 2.5 : 1.5, opacity: isSelected ? 1 : 0.6, interactive: false }).addTo(this.layers);
        this.airport(origin, flight.origin.code, color, fill, compact).addTo(this.layers);
      }
      if (flight.destination) {
        const destination: L.LatLngTuple = [flight.destination.latitude, nearestLongitude(flight.longitude, flight.destination.longitude)];
        bounds.push(destination);
        L.polyline([here, destination], { color, weight: 1.5, opacity: isSelected ? 0.7 : 0.4, dashArray: '4 6', interactive: false }).addTo(this.layers);
        this.airport(destination, flight.destination.code, color, fill, compact).addTo(this.layers);
      }

      const size = isSelected ? 30 : 24;
      const marker = L.marker(here, {
        icon: L.divIcon({
          className: 'sb-live-plane',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          html: `${isSelected ? '<span class="sb-live-pulse"></span>' : ''}<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="transform: rotate(${flight.heading}deg)"><path d="${PLANE}" fill="${isSelected ? PRIMARY : idle}" stroke="${fill}" stroke-width="1"/></svg>`
        }),
        zIndexOffset: isSelected ? 1000 : 0,
        keyboard: !compact
      }).addTo(this.layers);

      if (!compact) {
        marker
          .bindTooltip(`<span class="sb-tooltip-code">${escape(flight.callsign)}</span>`, {
            permanent: true,
            direction: 'right',
            offset: [size / 2, 0],
            className: isSelected ? 'sb-live-label sb-live-label-selected' : 'sb-live-label'
          })
          .on('click', () => this.selectedChange.emit(key));
      }
    }

    if (!this.fitted && bounds.length) {
      this.fitted = true;
      this.map!.invalidateSize();
      this.map!.fitBounds(L.latLngBounds(bounds), compact ? { padding: [24, 24], maxZoom: 6 } : { paddingTopLeft: [50, 60], paddingBottomRight: [50, 90], maxZoom: 6 });
    }
  }

  private airport(position: L.LatLngTuple, code: string, color: string, fill: string, compact: boolean): L.CircleMarker {
    const pin = L.circleMarker(position, { radius: 4, color, weight: 1.5, fillColor: fill, fillOpacity: 1, interactive: !compact });
    return compact ? pin : pin.bindTooltip(`<span class="sb-tooltip-code">${escape(code)}</span>`, { direction: 'top', offset: [0, -4] });
  }
}

function escape(text: string): string {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}