import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { PublicStats } from '../../core/public/public.models';
import { PublicService } from '../../core/public/public.service';
import { FlipCounter } from '../../shared/public/flip-counter';

@Component({
  selector: 'sb-operations-page',
  imports: [FlipCounter],
  template: `
    <div class="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
      <section>
        <p class="font-mono text-xs tracking-[0.2em] text-primary">OUR NUMBERS</p>
        <h1 class="mt-2 font-display text-5xl font-bold">Total flights</h1>
        <div class="mt-6"><sb-flip-counter [value]="stats()?.totalFlights ?? null" [minDigits]="6" data-testid="total-flights" /></div>
        <p class="mt-3 text-muted">Accepted flights since 2026.</p>
        <div class="mt-8 h-px w-20 bg-primary"></div>
        <ul class="mt-8 space-y-4" data-testid="highlights">
          @for (item of highlights(); track item) {
            <li class="flex items-start gap-3">
              <span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
              </span>
              {{ item }}
            </li>
          }
        </ul>
      </section>

      <section class="grid gap-x-10 gap-y-12 sm:grid-cols-2" data-testid="numbers">
        <div>
          <div class="flex flex-wrap items-end gap-4">
            <div>
              <sb-flip-counter [value]="stats()?.onlineVatsim ?? null" data-testid="online-vatsim" />
              <p class="mt-1 font-mono text-[10px] tracking-[0.2em] text-muted">VATSIM</p>
            </div>
            <div>
              <sb-flip-counter [value]="stats()?.onlineIvao ?? null" data-testid="online-ivao" />
              <p class="mt-1 font-mono text-[10px] tracking-[0.2em] text-muted">IVAO</p>
            </div>
          </div>
          <p class="mt-4 text-xl font-semibold">Online now</p>
          <div class="mt-3 h-px w-16 bg-line"></div>
          <p class="mt-3 text-sm text-muted">SkyBridge pilots connected to VATSIM and IVAO right now.</p>
        </div>
        <div>
          <sb-flip-counter [value]="stats()?.flightsThisMonth ?? null" data-testid="month-flights" />
          <p class="mt-4 text-xl font-semibold">Flights</p>
          <div class="mt-3 h-px w-16 bg-line"></div>
          <p class="mt-3 text-sm text-muted" data-testid="month-label">Flown in {{ month }}.</p>
        </div>
        <div>
          <sb-flip-counter [value]="stats()?.aircraft ?? null" data-testid="aircraft-count" />
          <p class="mt-4 text-xl font-semibold">Aircraft</p>
          <div class="mt-3 h-px w-16 bg-line"></div>
          <p class="mt-3 text-sm text-muted">From trainers to wide-bodies, unlocked by your flight hours.</p>
        </div>
        <div>
          <sb-flip-counter [value]="stats()?.destinations ?? null" data-testid="destinations" />
          <p class="mt-4 text-xl font-semibold">Destinations</p>
          <div class="mt-3 h-px w-16 bg-line"></div>
          <p class="mt-3 text-sm text-muted">Served by the airlines we fly, and growing with their real schedules.</p>
        </div>
      </section>
    </div>
    @if (failed()) {
      <p class="sb-error mt-8" data-testid="stats-error">We could not load the numbers right now. They will refresh in a minute.</p>
    }
  `
})
export class OperationsPage {
  protected readonly stats = signal<PublicStats | null>(null);
  protected readonly failed = signal(false);
  protected readonly month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date());

  constructor() {
    const service = inject(PublicService);
    interval(60_000)
      .pipe(
        startWith(0),
        switchMap(() =>
          service.stats().pipe(
            catchError(() => {
              this.failed.set(true);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(stats => {
        if (!stats) return;
        this.failed.set(false);
        this.stats.set(stats);
      });
  }

  protected highlights(): string[] {
    const stats = this.stats();
    return [
      'Real airline schedules from the CGNA flight plans',
      `${stats?.airlines ?? 0} airlines and freelance missions across the map`,
      'Careers built on flight hours, from the 172 to the 777',
      'Any simulator, online on VATSIM and IVAO or offline',
      `${stats?.pilots ?? 0} pilots in the crew`
    ];
  }
}