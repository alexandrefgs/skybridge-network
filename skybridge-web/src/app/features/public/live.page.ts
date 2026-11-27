import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { LiveMap as LiveMapData, LiveNetwork } from '../../core/public/public.models';
import { PublicService } from '../../core/public/public.service';
import { airportLabel, altitudeLabel, flightKey, missionTag, phaseLabel, progress, routeDistanceNm } from '../../shared/live/live-flight';
import { LiveMap } from '../../shared/map/live-map';

type Filter = 'All' | LiveNetwork;

@Component({
  selector: 'sb-live-page',
  imports: [DatePipe, DecimalPipe, LiveMap],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="font-mono text-xs tracking-[0.2em] text-primary">LIVE MAP</p>
        <h1 class="mt-2 font-display text-5xl font-bold">Flights in the air</h1>
        <p class="mt-2 text-muted">SkyBridge pilots connected to VATSIM and IVAO right now.</p>
      </div>
      <div class="flex flex-wrap gap-2 font-mono text-xs" data-testid="live-counters">
        <span class="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-foreground">
          <span class="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_rgb(239_35_60/0.18)]"></span>{{ flights().length }} airborne
        </span>
        @for (network of networks; track network) {
          @if (available(network)) {
            <span class="rounded-full border border-line bg-surface px-3 py-1.5 text-muted">{{ network }} {{ count(network) }}</span>
          } @else {
            <span class="rounded-full border border-amber-500/40 bg-surface px-3 py-1.5 text-amber-500" [attr.data-testid]="'offline-' + network">{{ network }} feed offline</span>
          }
        }
        @if (data(); as live) {
          <span class="rounded-full border border-line bg-surface px-3 py-1.5 text-muted">Updated {{ live.updatedAtUtc | date: 'HH:mm:ss' : 'UTC' }} UTC</span>
        }
      </div>
    </div>

    <div class="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div class="sb-card relative h-[480px] overflow-hidden p-0 lg:h-[640px]">
        <sb-live-map class="h-full" [flights]="visible()" [selected]="selected() ? key(selected()!) : null" (selectedChange)="selectedKey.set($event)" />
        <div class="absolute right-3 top-3 z-[1000] flex gap-1.5 font-mono text-xs" data-testid="live-filters">
          @for (option of filters; track option) {
            <button type="button" class="rounded-full border bg-surface px-3 py-1.5 transition-colors"
              [class]="filter() === option ? 'border-primary text-foreground' : 'border-line text-muted hover:text-foreground'"
              (click)="filter.set(option)" [attr.data-testid]="'filter-' + option">{{ option }}</button>
          }
        </div>
        @if (loaded() && !visible().length) {
          <div class="absolute inset-0 z-[900] grid place-items-center bg-background/40 p-6 text-center" data-testid="live-empty">
            <div class="max-w-sm rounded-xl border border-line bg-surface p-6">
              <p class="font-display text-xl font-bold">Nobody is in the air right now</p>
              <p class="mt-2 text-sm text-muted">Pilots show up here when they connect to VATSIM or IVAO with the ID linked in their SkyBridge profile.</p>
            </div>
          </div>
        }
        <p class="absolute bottom-7 left-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-md border border-line bg-surface/90 px-3 py-2 text-xs text-muted">
          Only flights connected to VATSIM or IVAO are tracked. Offline flights join when the ACARS app ships.
        </p>
      </div>

      <div class="space-y-4">
        @if (selected(); as flight) {
          <section class="sb-card p-6" data-testid="live-selected">
            <div class="flex items-center justify-between">
              <p class="font-mono text-[10px] tracking-[0.2em] text-muted">SELECTED FLIGHT</p>
              <span class="rounded border border-sky-300/30 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-sky-300">{{ flight.network }}</span>
            </div>
            <p class="mt-2 font-display text-3xl font-bold" data-testid="selected-callsign">{{ flight.callsign }}</p>
            <p class="text-sm text-muted">
              {{ flight.pilot }}
              @if (flight.aircraft) { · <span class="font-mono">{{ flight.aircraft }}</span> {{ flight.aircraftModel ?? '' }} }
            </p>

            <div class="mt-6 flex items-end justify-between gap-3">
              <div class="min-w-0">
                <p class="font-mono text-2xl font-bold">{{ airport(flight.origin) }}</p>
                <p class="truncate text-xs text-muted">{{ flight.origin?.name ?? 'Unknown origin' }}</p>
              </div>
              @if (distance(flight); as nm) {
                <p class="whitespace-nowrap pb-5 font-mono text-xs text-muted">{{ nm | number }} nm</p>
              }
              <div class="min-w-0 text-right">
                <p class="font-mono text-2xl font-bold">{{ airport(flight.destination) }}</p>
                <p class="truncate text-xs text-muted">{{ flight.destination?.name ?? 'Unknown destination' }}</p>
              </div>
            </div>
            @if (done(flight); as value) {
              <div class="mt-3 h-1 overflow-hidden rounded bg-line" data-testid="selected-progress">
                <div class="h-full bg-primary" [style.width.%]="value * 100"></div>
              </div>
            }

            <dl class="mt-5 grid grid-cols-3 gap-2.5">
              <div class="rounded-lg bg-surface-2 p-3">
                <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">ALTITUDE</dt>
                <dd class="mt-1.5 font-mono text-lg font-semibold" data-testid="selected-altitude">{{ altitude(flight.altitudeFt) }}</dd>
              </div>
              <div class="rounded-lg bg-surface-2 p-3">
                <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">GROUND SPD</dt>
                <dd class="mt-1.5 font-mono text-lg font-semibold">{{ flight.groundSpeedKt }} kt</dd>
              </div>
              <div class="rounded-lg bg-surface-2 p-3">
                <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">HEADING</dt>
                <dd class="mt-1.5 font-mono text-lg font-semibold">{{ heading(flight.heading) }}°</dd>
              </div>
            </dl>
            <div class="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
              <span>Phase: <span class="text-foreground" data-testid="selected-phase">{{ phase(flight) }}</span></span>
              @if (mission(flight); as tag) {
                <span class="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em]">{{ tag }}</span>
              }
            </div>
          </section>
        }

        <section class="sb-card overflow-hidden p-0" data-testid="live-list">
          <div class="flex items-center justify-between px-5 py-3.5">
            <p class="font-mono text-[10px] tracking-[0.2em] text-muted">IN THE AIR · {{ visible().length }}</p>
          </div>
          @for (flight of visible(); track key(flight)) {
            <button type="button" class="flex w-full items-center gap-3 border-t border-line px-5 py-3.5 text-left transition-colors hover:bg-surface-2"
              [class.bg-surface-2]="selected() === flight" (click)="selectedKey.set(key(flight))" data-testid="live-row">
              <span class="w-0.5 self-stretch rounded" [class.bg-primary]="selected() === flight"></span>
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="font-mono font-semibold">{{ flight.callsign }}</span>
                  @if (mission(flight); as tag) {
                    <span class="hidden whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] sm:inline"
                      [class]="flight.mission === 'Airline' ? 'border-line text-muted' : 'border-primary/40 text-primary'">{{ tag }}</span>
                  }
                </span>
                <span class="mt-0.5 block truncate text-xs text-muted">{{ flight.pilot }}@if (flight.aircraft) { · <span class="font-mono">{{ flight.aircraft }}</span> }</span>
              </span>
              <span class="text-right font-mono">
                <span class="block text-sm">{{ airport(flight.origin) }} → {{ airport(flight.destination) }}</span>
                <span class="mt-0.5 block text-[11px] text-muted">{{ altitude(flight.altitudeFt) }} · {{ flight.groundSpeedKt }} kt</span>
              </span>
            </button>
          } @empty {
            <p class="border-t border-line px-5 py-6 text-sm text-muted">No flights to show.</p>
          }
        </section>
      </div>
    </div>
  `
})
export class LivePage {
  protected readonly networks: LiveNetwork[] = ['VATSIM', 'IVAO'];
  protected readonly filters: Filter[] = ['All', 'VATSIM', 'IVAO'];
  protected readonly data = signal<LiveMapData | null>(null);
  protected readonly loaded = computed(() => this.data() !== null);
  protected readonly filter = signal<Filter>('All');
  protected readonly selectedKey = signal<string | null>(null);
  protected readonly flights = computed(() => this.data()?.flights ?? []);
  protected readonly visible = computed(() => {
    const filter = this.filter();
    return this.flights().filter(f => filter === 'All' || f.network === filter);
  });
  protected readonly selected = computed(() => {
    const visible = this.visible();
    return visible.find(f => flightKey(f) === this.selectedKey()) ?? visible[0] ?? null;
  });

  protected readonly key = flightKey;
  protected readonly airport = airportLabel;
  protected readonly altitude = altitudeLabel;
  protected readonly phase = phaseLabel;
  protected readonly mission = missionTag;
  protected readonly distance = routeDistanceNm;
  protected readonly done = progress;

  constructor() {
    const service = inject(PublicService);
    interval(60_000)
      .pipe(
        startWith(0),
        switchMap(() => service.live().pipe(catchError(() => of(null)))),
        takeUntilDestroyed()
      )
      .subscribe(live => {
        if (live) this.data.set(live);
      });
  }

  protected available(network: LiveNetwork): boolean {
    const live = this.data();
    if (!live) return true;
    return network === 'VATSIM' ? live.vatsimAvailable : live.ivaoAvailable;
  }

  protected count(network: LiveNetwork): number {
    return this.flights().filter(f => f.network === network).length;
  }

  protected heading(value: number): string {
    return String(value).padStart(3, '0');
  }
}