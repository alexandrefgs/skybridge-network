import { Component, ElementRef, OnDestroy, afterNextRender, effect, inject, input, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { RouteNetwork } from '../../core/airlines/airline.models';
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

  private readonly theme = inject(ThemeService);
  private readonly config = inject(ClientConfigService);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private readonly ready = signal(false);
  private readonly lines = L.layerGroup();
  private readonly pins = L.layerGroup();
  private map?: L.Map;
  private tiles?: L.TileLayer;

  constructor() {
    afterNextRender(() => {
      this.map = L.map(this.container().nativeElement, { preferCanvas: true, worldCopyJump: true, zoomSnap: 0.25 }).setView([-15, -50], 3);
      this.lines.addTo(this.map);
      this.pins.addTo(this.map);
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
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private render(network: RouteNetwork | null): void {
    const fill = this.theme.theme() === 'dark' ? '#0a0a0b' : '#ffffff';
    this.lines.clearLayers();
    this.pins.clearLayers();
    if (!network?.airports.length) return;

    const points = network.airports.map(a => [a.latitude, a.longitude] as L.LatLngTuple);
    const opacity = network.links.length > 300 ? 0.25 : 0.5;

    for (const [from, to] of network.links) {
      L.polyline([points[from], points[to]], { color: PRIMARY, weight: 1, opacity, interactive: false }).addTo(this.lines);
    }

    network.airports.forEach((airport, position) => {
      L.circleMarker(points[position], { radius: 4, color: PRIMARY, weight: 1.5, fillColor: fill, fillOpacity: 1 })
        .bindTooltip(airport.iataCode ? `${airport.code} · ${airport.iataCode}<br>${airport.name}` : `${airport.code}<br>${airport.name}`, { direction: 'top', offset: [0, -4] })
        .addTo(this.pins);
    });

    this.map!.invalidateSize();
    this.map!.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 7 });
  }
}