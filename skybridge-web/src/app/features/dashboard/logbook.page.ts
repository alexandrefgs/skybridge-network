import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import { problemMessages } from '../../core/http/problem';
import { Logbook, LogbookPeriod } from '../../core/pireps/pirep.models';
import { PIREP_PAGE_SIZE, PirepService } from '../../core/pireps/pirep.service';
import { PirepStatusBadge } from '../../shared/flights/pirep-status';
import { RouteMap } from '../../shared/map/route-map';
import { durationLabel } from '../../shared/time/utc';

@Component({
  selector: 'sb-logbook-page',
  imports: [RouterLink, DatePipe, DecimalPipe, CurrencyPipe, RouteMap, PirepStatusBadge],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="font-mono text-xs tracking-[0.2em] text-primary">PILOT</p>
        <h1 class="mt-1 font-display text-3xl font-bold">Logbook</h1>
        <p class="mt-1 text-muted">Every leg you filed, where you flew and what you earned.</p>
      </div>
      <div class="flex rounded-lg border border-line p-1" role="tablist" data-testid="periods">
        @for (option of periods; track option.value) {
          <button type="button" role="tab" class="rounded-md px-3 py-1.5 text-sm transition-colors"
            [class.bg-primary]="period() === option.value" [class.text-primary-foreground]="period() === option.value"
            [class.text-muted]="period() !== option.value" [attr.aria-selected]="period() === option.value"
            (click)="choose(option.value)" [attr.data-testid]="'period-' + option.value">{{ option.label }}</button>
        }
      </div>
    </div>

    @if (error(); as message) {
      <p class="sb-error mt-6" data-testid="logbook-error">{{ message }}</p>
    }

    @if (logbook(); as book) {
      <dl class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="summary">
        <div class="sb-card p-4">
          <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">FLIGHTS</dt>
          <dd class="mt-1 font-mono text-2xl font-semibold" data-testid="stat-flights">{{ book.summary.flights }}</dd>
        </div>
        <div class="sb-card p-4">
          <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">FLIGHT TIME</dt>
          <dd class="mt-1 font-mono text-2xl font-semibold" data-testid="stat-time">{{ time(book.summary.flightMinutes) }}</dd>
        </div>
        <div class="sb-card p-4">
          <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">DISTANCE</dt>
          <dd class="mt-1 font-mono text-2xl font-semibold">{{ book.summary.distanceNm | number }} <span class="text-sm text-muted">nm</span></dd>
        </div>
        <div class="sb-card p-4">
          <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">EARNED</dt>
          <dd class="mt-1 font-mono text-2xl font-semibold text-primary" data-testid="stat-earned">{{ book.summary.earned | currency: 'USD' : 'symbol' : '1.0-0' }}</dd>
        </div>
        <div class="sb-card p-4">
          <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">AVG LANDING</dt>
          <dd class="mt-1 font-mono text-2xl font-semibold" data-testid="stat-landing">
            @if (book.summary.averageLandingRateFpm !== null) {
              -{{ book.summary.averageLandingRateFpm }} <span class="text-sm text-muted">fpm</span>
            } @else { — }
          </dd>
        </div>
        <div class="sb-card p-4">
          <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">AIRPORTS · FAVORITE</dt>
          <dd class="mt-1 font-mono text-2xl font-semibold">{{ book.summary.airports }} <span class="text-sm text-muted">· {{ book.summary.favoriteAircraft ?? '—' }}</span></dd>
        </div>
      </dl>

      @if (book.network.airports.length) {
        <div class="sb-card mt-6 overflow-hidden p-0">
          <sb-route-map class="h-[380px]" [network]="book.network" [showAll]="true" data-testid="logbook-map" />
        </div>
      }

      <div class="sb-card mt-6 overflow-x-auto p-0">
        <table class="w-full text-sm" data-testid="flights">
          <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th class="px-4 py-3 font-medium">Date</th>
              <th class="px-4 py-3 font-medium">Route</th>
              <th class="px-4 py-3 font-medium">Aircraft</th>
              <th class="px-4 py-3 text-right font-medium">Time</th>
              <th class="px-4 py-3 text-right font-medium">Distance</th>
              <th class="px-4 py-3 text-right font-medium">Landing</th>
              <th class="px-4 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            @for (flight of book.flights.items; track flight.id) {
              <tr [attr.data-testid]="'flight-' + flight.id">
                <td class="whitespace-nowrap px-4 py-3 font-mono text-muted">{{ flight.arrivedAtUtc | date: 'dd MMM yyyy' : 'UTC' }}</td>
                <td class="whitespace-nowrap px-4 py-3 font-mono font-semibold">
                  {{ flight.origin }} → {{ flight.destination }}
                  @if (flight.legCount > 1) {
                    <span class="ml-1 text-xs font-normal text-muted">leg {{ flight.leg }}/{{ flight.legCount }}</span>
                  }
                </td>
                <td class="px-4 py-3 font-mono">{{ flight.aircraft }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ time(flight.flightMinutes) }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ flight.distanceNm | number }} nm</td>
                <td class="px-4 py-3 text-right font-mono">{{ flight.landingRateFpm !== null ? '-' + flight.landingRateFpm + ' fpm' : '—' }}</td>
                <td class="px-4 py-3 text-right" [title]="flight.flag ?? flight.reviewNote ?? ''"><sb-pirep-status [status]="flight.status" /></td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-4 py-10 text-center text-muted" data-testid="no-flights">
                  {{ period() === 'all' ? 'No flights yet.' : 'No flights in this period.' }}
                  <a routerLink="/freelance" class="ml-1 text-primary hover:underline">Find a job</a>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-between border-t border-line px-4 py-3 text-sm" data-testid="pager">
            <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="page() <= 1" (click)="page.set(page() - 1)">← Previous</button>
            <span class="text-muted">Page {{ page() }} of {{ totalPages() }}</span>
            <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)" data-testid="next-page">Next →</button>
          </div>
        }
      </div>
    }
  `
})
export class LogbookPage {
  private readonly pireps = inject(PirepService);

  protected readonly periods: { value: LogbookPeriod; label: string }[] = [
    { value: '30d', label: '30 days' },
    { value: '1y', label: '1 year' },
    { value: 'all', label: 'All' }
  ];
  protected readonly period = signal<LogbookPeriod>('30d');
  protected readonly page = signal(1);
  protected readonly logbook = signal<Logbook | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly totalPages = computed(() => Math.ceil((this.logbook()?.flights.totalCount ?? 0) / PIREP_PAGE_SIZE));
  protected readonly time = durationLabel;

  private readonly query = computed(() => ({ period: this.period(), page: this.page() }));

  constructor() {
    toObservable(this.query)
      .pipe(
        tap(() => this.error.set(null)),
        switchMap(({ period, page }) =>
          this.pireps.logbook(period, page).pipe(
            catchError(error => {
              this.error.set(problemMessages(error)[0]);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(logbook => {
        if (logbook) this.logbook.set(logbook);
      });
  }

  protected choose(period: LogbookPeriod): void {
    this.period.set(period);
    this.page.set(1);
  }
}