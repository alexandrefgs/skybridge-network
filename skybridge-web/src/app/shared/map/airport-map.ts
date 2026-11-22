import { Component, ElementRef, OnDestroy, afterNextRender, effect, inject, input, output, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { Airport } from '../../core/airports/airport.models';
import { ClientConfigService } from '../../core/config/client-config.service';
import { ThemeService } from '../../core/theme/theme.service';

const TILE_STYLES = { dark: 'dark_all', light: 'light_all' } as const;

const tileUrl = (theme: keyof typeof TILE_STYLES, key: string | null) =>
  `https://basemaps.cartocdn.com/rastertiles/${TILE_STYLES[theme]}/{z}/{x}/{y}{r}.png` + (key ? `?key=${encodeURIComponent(key)}` : '');

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const PRIMARY = '#ef233c';

@Component({
  selector: 'sb-airport-map',
  host: { class: 'block' },
  template: `<div #map class="h-full w-full" data-testid="airport-map"></div>`
})
export class AirportMap implements OnDestroy {
  readonly airports = input<Airport[]>([]);
  readonly selected = input<Airport | null>(null);
  readonly airportClick = output<Airport>();

  private readonly theme = inject(ThemeService);
  private readonly config = inject(ClientConfigService);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private readonly ready = signal(false);
  private readonly markers = L.layerGroup();
  private map?: L.Map;
  private tiles?: L.TileLayer;

  constructor() {
    afterNextRender(() => {
      this.map = L.map(this.container().nativeElement, { worldCopyJump: true, zoomControl: true }).setView([-15, -50], 3);
      this.markers.addTo(this.map);
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
      const airports = this.airports();
      if (!this.ready() || !this.map) return;
      if (airports.length) {
        const bounds = L.latLngBounds(airports.map(a => [a.latitude, a.longitude] as L.LatLngTuple));
        this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
      }
    });

    effect(() => {
      const airports = this.airports();
      const selected = this.selected();
      if (!this.ready()) return;
      this.renderMarkers(airports, selected);
    });

    effect(() => {
      const selected = this.selected();
      if (!this.ready() || !this.map || !selected) return;
      this.map.flyTo([selected.latitude, selected.longitude], Math.max(this.map.getZoom(), 9), { duration: 0.8 });
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private renderMarkers(airports: Airport[], selected: Airport | null): void {
    const fill = this.theme.theme() === 'dark' ? '#0a0a0b' : '#ffffff';
    this.markers.clearLayers();
    for (const airport of airports) {
      const isSelected = airport.ident === selected?.ident;
      L.circleMarker([airport.latitude, airport.longitude], {
        radius: isSelected ? 9 : 6,
        color: PRIMARY,
        weight: 2,
        fillColor: isSelected ? PRIMARY : fill,
        fillOpacity: 1
      })
        .bindTooltip(airport.iataCode ? `${airport.ident} · ${airport.iataCode}` : airport.ident, { direction: 'top', offset: [0, -6] })
        .on('click', () => this.airportClick.emit(airport))
        .addTo(this.markers);
    }
  }
}