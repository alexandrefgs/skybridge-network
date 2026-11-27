import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { Pilot } from '../../core/pilot/pilot.models';
import { LiveFlight } from '../../core/public/public.models';
import { PublicService } from '../../core/public/public.service';
import { airportLabel, flightKey } from '../../shared/live/live-flight';
import { LiveMap } from '../../shared/map/live-map';

const SHOWN = 4;

@Component({
  selector: 'sb-live-card',
  imports: [RouterLink, LiveMap],
  template: `
    <section class="sb-card grid overflow-hidden p-0 lg:grid-cols-[1.25fr_1fr]" data-testid="live-card">
      @if (flights().length) {
        <sb-live-map class="h-56 lg:h-auto lg:min-h-[300px]" [flights]="flights()" [selected]="highlight()" [compact]="true" />
      }
      <div class="flex flex-col p-6" [class.lg:col-span-2]="!flights().length">
        <div class="flex items-center justify-between">
          <p class="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.2em] text-muted">
            <span class="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_rgb(239_35_60/0.18)]"></span>IN THE AIR NOW
          </p>
          <span class="font-mono text-xs text-muted" data-testid="live-count">{{ flights().length }} {{ flights().length === 1 ? 'pilot' : 'pilots' }}</span>
        </div>

        <ul class="mt-3 flex-1 divide-y divide-line">
          @for (flight of shown(); track key(flight)) {
            <li class="flex items-center justify-between gap-3 py-2.5 text-sm" data-testid="live-card-row">
              <span class="min-w-0 truncate"><span class="font-mono font-semibold">{{ flight.callsign }}</span> <span class="text-xs text-muted">{{ flight.pilot }}</span></span>
              <span class="flex shrink-0 items-center gap-2.5">
                <span class="font-mono text-xs text-muted">{{ airport(flight.origin) }} → {{ airport(flight.destination) }}</span>
                <span class="rounded border border-sky-300/30 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-sky-300">{{ flight.network }}</span>
              </span>
            </li>
          } @empty {
            <li class="py-3 text-sm text-muted" data-testid="live-card-empty">Nobody from SkyBridge is flying online right now.</li>
          }
        </ul>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-muted" data-testid="live-you">
            @if (mine(); as flight) {
              You: <span class="font-mono text-foreground">{{ flight.callsign }}</span> is being tracked on {{ flight.network }}
            } @else if (linked()) {
              Connect to VATSIM or IVAO and you show up here.
            } @else {
              Link your VATSIM CID or IVAO VID to show up here.
            }
          </p>
          <a routerLink="/live" class="sb-btn-primary inline-block w-auto px-4 py-2" data-testid="open-live">Open live map →</a>
        </div>
      </div>
    </section>
  `
})
export class LiveCard {
  readonly pilot = input<Pilot | null>(null);

  protected readonly flights = signal<LiveFlight[]>([]);
  protected readonly shown = computed(() => this.flights().slice(0, SHOWN));
  protected readonly linked = computed(() => !!this.pilot()?.vatsimId || !!this.pilot()?.ivaoId);
  protected readonly mine = computed(() => {
    const pilot = this.pilot();
    if (!pilot) return null;
    return this.flights().find(f =>
      (f.network === 'VATSIM' && f.networkId === pilot.vatsimId) || (f.network === 'IVAO' && f.networkId === pilot.ivaoId)) ?? null;
  });
  protected readonly highlight = computed(() => {
    const flight = this.mine() ?? this.flights()[0];
    return flight ? flightKey(flight) : null;
  });
  protected readonly key = flightKey;
  protected readonly airport = airportLabel;

  constructor() {
    const service = inject(PublicService);
    interval(60_000)
      .pipe(
        startWith(0),
        switchMap(() => service.live().pipe(catchError(() => of(null)))),
        takeUntilDestroyed()
      )
      .subscribe(live => {
        if (live) this.flights.set(live.flights);
      });
  }
}