import { Component, ElementRef, OnDestroy, afterNextRender, effect, inject, input, output, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { NetworkAirport, RouteFilter, RouteNetwork } from '../../core/airlines/airline.models';
import { ClientConfigService } from '../../core/config/client-config.service';
import { ThemeService } from '../../core/theme/theme.service';
import { ATTRIBUTION, PRIMARY, tileUrl } from './map-tiles';

@Component({
  selector: 'sb-route-map',
  host: { class: 'block' },
  template: `<div #map class="h-full w-full" data-testid="route-map"></div>`
})
export class RouteMap implements OnDestroy {
  readonly network = input<RouteNetwork | null>(null);
  readonly filter = input<RouteFilter | null>(null);
  readonly filterChange = output<RouteFilter | null>();

  private readonly theme = inject(ThemeService);
  private readonly config = inject(ClientConfigService);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private readonly ready = signal(false);
  private readonly pins = L.layerGroup();
  private readonly routes = L.layerGroup();
  private readonly pinLayers = new Map<string, L.CircleMarker>();
  private map?: L.Map;
  private tiles?: L.TileLayer;
  private lastOrigin: string | null | undefined;

  constructor() {
    afterNextRender(() => {
      this.map = L.map(this.container().nativeElement, {
        preferCanvas: true,
        renderer: L.canvas({ tolerance: 6 }),
        worldCopyJump: true,
        zoomSnap: 0.25
      }).setView([-15, -50], 3);
      this.routes.addTo(this.map);
      this.pins.addTo(this.map);
      this.map.on('click', () => this.filterChange.emit(null));
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
      const network = this.network();
      if (!this.ready() || !this.map) return;
      this.renderPins(network);
      this.lastOrigin = undefined;
    });

    effect(() => {
      const network = this.network();
      const filter = this.filter();
      this.theme.theme();
      if (!this.ready() || !network) return;
      this.renderRoutes(network, filter);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private renderPins(network: RouteNetwork | null): void {
    this.pins.clearLayers();
    this.pinLayers.clear();
    if (!network?.airports.length) return;

    for (const airport of network.airports) {
      const pin = this.pin(airport, [airport.latitude, airport.longitude]).addTo(this.pins);
      this.pinLayers.set(airport.code, pin);
    }
  }

  private renderRoutes(network: RouteNetwork, filter: RouteFilter | null): void {
    const fill = this.theme.theme() === 'dark' ? '#0a0a0b' : '#ffffff';
    this.routes.clearLayers();

    const origin = filter ? network.airports.findIndex(a => a.code === filter.from) : -1;
    const from = origin >= 0 ? network.airports[origin] : null;
    const destinations = from ? network.links.filter(([a]) => a === origin).map(([, b]) => network.airports[b]) : [];
    const reachable = new Set(destinations.map(d => d.code));

    for (const [code, pin] of this.pinLayers) {
      const isOrigin = code === from?.code;
      const isTarget = code === filter?.to;
      const dimmed = !!from && !isOrigin && !reachable.has(code);
      pin.setStyle({
        radius: isOrigin || isTarget ? 7 : 4,
        fillColor: isOrigin || isTarget ? PRIMARY : fill,
        opacity: dimmed ? 0.25 : 1,
        fillOpacity: dimmed ? 0.25 : 1
      });
      if (isOrigin || isTarget) pin.bringToFront();
    }

    const bounds: L.LatLngTuple[] = [];
    if (from) {
      bounds.push([from.latitude, from.longitude]);
      for (const destination of destinations) {
        const end: L.LatLngTuple = [destination.latitude, nearestLongitude(from.longitude, destination.longitude)];
        const isTarget = destination.code === filter?.to;
        L.polyline([[from.latitude, from.longitude], end], {
          color: PRIMARY,
          weight: isTarget ? 3 : 1.5,
          opacity: filter?.to ? (isTarget ? 1 : 0.2) : 0.7
        })
          .bindTooltip(`<span class="sb-tooltip-code">${escape(from.code)} → ${escape(destination.code)}</span>`, { sticky: true })
          .on('click', event => {
            L.DomEvent.stopPropagation(event);
            this.filterChange.emit({ from: from.code, to: destination.code });
          })
          .addTo(this.routes);

        if (end[1] !== destination.longitude) {
          this.pin(destination, end)
            .setStyle({ radius: isTarget ? 7 : 4, fillColor: isTarget ? PRIMARY : fill })
            .addTo(this.routes);
        }
        bounds.push(end);
      }
    }

    const originCode = from?.code ?? null;
    if (originCode !== this.lastOrigin) {
      this.lastOrigin = originCode;
      const points = bounds.length > 1 ? bounds : network.airports.map(a => [a.latitude, a.longitude] as L.LatLngTuple);
      this.map!.invalidateSize();
      this.map!.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: from ? 6 : 7 });
    }
  }

  private pin(airport: NetworkAirport, position: L.LatLngTuple): L.CircleMarker {
    const fill = this.theme.theme() === 'dark' ? '#0a0a0b' : '#ffffff';
    return L.circleMarker(position, { radius: 4, color: PRIMARY, weight: 1.5, fillColor: fill, fillOpacity: 1 })
      .bindTooltip(tooltip(airport), { direction: 'top', offset: [0, -4] })
      .on('click', event => {
        L.DomEvent.stopPropagation(event);
        this.filterChange.emit({ from: airport.code, to: null });
      });
  }
}

export function nearestLongitude(reference: number, longitude: number): number {
  let value = longitude;
  while (value - reference > 180) value -= 360;
  while (value - reference < -180) value += 360;
  return value;
}

function tooltip(airport: NetworkAirport): string {
  const iata = airport.iataCode ? ` <span class="sb-tooltip-muted">· ${escape(airport.iataCode)}</span>` : '';
  return `<span class="sb-tooltip-code">${escape(airport.code)}</span>${iata}<br><span class="sb-tooltip-muted">${escape(airport.name)}</span>`;
}

function escape(text: string): string {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}