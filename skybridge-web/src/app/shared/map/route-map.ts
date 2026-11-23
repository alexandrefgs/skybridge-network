import { Component, ElementRef, OnDestroy, afterNextRender, effect, inject, input, output, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { AirportPair, RouteNetwork } from '../../core/airlines/airline.models';
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
  readonly selected = input<AirportPair | null>(null);
  readonly selectedChange = output<AirportPair | null>();

  private readonly theme = inject(ThemeService);
  private readonly config = inject(ClientConfigService);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private readonly ready = signal(false);
  private readonly lines = L.layerGroup();
  private readonly pins = L.layerGroup();
  private readonly lineLayers = new Map<string, L.Polyline>();
  private readonly pinLayers = new Map<string, L.CircleMarker>();
  private map?: L.Map;
  private tiles?: L.TileLayer;

  constructor() {
    afterNextRender(() => {
      this.map = L.map(this.container().nativeElement, {
        preferCanvas: true,
        renderer: L.canvas({ tolerance: 6 }),
        worldCopyJump: true,
        zoomSnap: 0.25
      }).setView([-15, -50], 3);
      this.lines.addTo(this.map);
      this.pins.addTo(this.map);
      this.map.on('click', () => this.selectedChange.emit(null));
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
      this.render(network);
    });

    effect(() => {
      const selected = this.selected();
      const network = this.network();
      if (!this.ready() || !network) return;
      this.highlight(network, selected);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private render(network: RouteNetwork | null): void {
    this.lines.clearLayers();
    this.pins.clearLayers();
    this.lineLayers.clear();
    this.pinLayers.clear();
    if (!network?.airports.length) return;

    const points = network.airports.map(a => [a.latitude, a.longitude] as L.LatLngTuple);

    for (const [from, to] of network.links) {
      const pair = [network.airports[from].code, network.airports[to].code] as const;
      const line = L.polyline([points[from], points[to]], { color: PRIMARY, weight: 1 })
        .bindTooltip(`${pair[0]} ⇄ ${pair[1]}`, { sticky: true })
        .on('click', event => {
          L.DomEvent.stopPropagation(event);
          this.selectedChange.emit(pair);
        })
        .addTo(this.lines);
      this.lineLayers.set(key(pair), line);
    }

    network.airports.forEach((airport, position) => {
      const pin = L.circleMarker(points[position], { radius: 4, color: PRIMARY, weight: 1.5, fillOpacity: 1 })
        .bindTooltip(airport.iataCode ? `${airport.code} · ${airport.iataCode}<br>${airport.name}` : `${airport.code}<br>${airport.name}`, { direction: 'top', offset: [0, -4] })
        .addTo(this.pins);
      this.pinLayers.set(airport.code, pin);
    });

    this.highlight(network, this.selected());
    this.map!.invalidateSize();
    this.map!.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 7 });
  }

  private highlight(network: RouteNetwork, selected: AirportPair | null): void {
    const fill = this.theme.theme() === 'dark' ? '#0a0a0b' : '#ffffff';
    const resting = network.links.length > 300 ? 0.25 : 0.5;
    const selectedKey = selected ? key(selected) : null;

    for (const [lineKey, line] of this.lineLayers) {
      const isSelected = lineKey === selectedKey;
      line.setStyle({ weight: isSelected ? 3 : 1, opacity: isSelected ? 1 : selected ? 0.08 : resting });
      if (isSelected) line.bringToFront();
    }

    for (const [code, pin] of this.pinLayers) {
      const isEnd = !!selected && selected.includes(code);
      pin.setStyle({ radius: isEnd ? 7 : 4, fillColor: isEnd ? PRIMARY : fill, opacity: selected && !isEnd ? 0.3 : 1, fillOpacity: selected && !isEnd ? 0.3 : 1 });
      if (isEnd) pin.bringToFront();
    }
  }
}

const key = (pair: AirportPair) => [...pair].sort().join('-');