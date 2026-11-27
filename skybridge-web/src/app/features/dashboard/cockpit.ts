import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Booking } from '../../core/bookings/booking.models';
import { BookingService } from '../../core/bookings/booking.service';
import { Pilot, PilotTransaction } from '../../core/pilot/pilot.models';
import { PilotService } from '../../core/pilot/pilot.service';
import { Logbook } from '../../core/pireps/pirep.models';
import { PirepService } from '../../core/pireps/pirep.service';
import { bookingRoute } from '../../shared/flights/booking-legs';
import { PirepStatusBadge } from '../../shared/flights/pirep-status';
import { durationLabel } from '../../shared/time/utc';
import { LiveCard } from './live-card';
import { NETWORK_PROMPT_KEY, NetworkPrompt } from './network-prompt';

const RECENT = 5;

@Component({
  selector: 'sb-cockpit',
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, PirepStatusBadge, NetworkPrompt, LiveCard],
  template: `
    @if (askNetworks()) {
      <sb-network-prompt (saved)="pilot.set($event); askNetworks.set(false)" (dismissed)="askNetworks.set(false)" />
    }
    <p class="font-mono text-xs tracking-[0.2em] text-primary">COCKPIT</p>
    <h1 class="mt-2 font-display text-4xl font-bold">Welcome, {{ firstName() }}.</h1>
    <p class="mt-2 text-muted" data-testid="location">
      @if (pilot()?.location; as location) {
        You are at <span class="font-mono text-foreground">{{ location.code }}</span> · {{ location.name }}
      } @else {
        Pick your first airport on the <a routerLink="/freelance" class="text-primary hover:underline">Freelance</a> board to start flying.
      }
    </p>

    <dl class="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="cockpit-stats">
      <div class="sb-card p-5">
        <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">FLIGHT TIME</dt>
        <dd class="mt-1 font-mono text-3xl font-semibold" data-testid="stat-hours">{{ time(pilot()?.flightMinutes ?? 0) }}</dd>
      </div>
      <div class="sb-card p-5">
        <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">BALANCE</dt>
        <dd class="mt-1 font-mono text-3xl font-semibold text-primary" data-testid="stat-balance">{{ (pilot()?.balance ?? 0) | currency: 'USD' : 'symbol' : '1.0-0' }}</dd>
      </div>
      <div class="sb-card p-5">
        <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">FLIGHTS · DISTANCE</dt>
        <dd class="mt-1 font-mono text-3xl font-semibold" data-testid="stat-flights">
          {{ logbook()?.summary?.flights ?? 0 }} <span class="text-sm text-muted">· {{ (logbook()?.summary?.distanceNm ?? 0) | number }} nm</span>
        </dd>
      </div>
      <div class="sb-card p-5">
        <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">AVG LANDING</dt>
        <dd class="mt-1 font-mono text-3xl font-semibold">
          @if (logbook()?.summary?.averageLandingRateFpm; as rate) {
            -{{ rate }} <span class="text-sm text-muted">fpm</span>
          } @else { — }
        </dd>
      </div>
    </dl>

    <sb-live-card class="mt-6 block" [pilot]="pilot()" />

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <section class="sb-card p-6" data-testid="active-flight">
        <p class="font-mono text-[10px] tracking-[0.2em] text-muted">ACTIVE FLIGHT</p>
        @if (booking(); as current) {
          <p class="mt-2 font-mono text-xl font-semibold">{{ route(current) }}</p>
          <p class="text-sm text-muted">
            {{ current.flightNumber ?? current.job?.client ?? 'Freelance job' }} · <span class="font-mono">{{ current.aircraft }}</span>
          </p>
          <p class="mt-3 text-sm" data-testid="active-status">
            @if (current.legInProgress) {
              <span class="font-semibold text-primary">Leg {{ current.currentLeg }} of {{ current.legCount }} in progress</span>
            } @else if (!current.flightPlan) {
              Import the SimBrief OFP for leg {{ current.currentLeg }} to start.
            } @else {
              Ready for leg {{ current.currentLeg }} of {{ current.legCount }}.
            }
          </p>
          <a routerLink="/flight" class="sb-btn-primary mt-4 inline-block w-auto px-5" data-testid="open-flight">Open flight</a>
        } @else {
          <p class="mt-2 text-muted">No active flight.</p>
          <div class="mt-4 flex flex-wrap gap-3">
            <a routerLink="/freelance" class="sb-btn-primary inline-block w-auto px-5">Find a freelance job</a>
            <a routerLink="/airlines" class="sb-btn-secondary inline-block w-auto px-5">Book an airline flight</a>
          </div>
        }
      </section>

      <section class="sb-card p-6" data-testid="recent-transactions">
        <div class="flex items-baseline justify-between">
          <p class="font-mono text-[10px] tracking-[0.2em] text-muted">WALLET</p>
          <a routerLink="/wallet" class="text-xs text-muted hover:text-primary">All transactions →</a>
        </div>
        <ul class="mt-3 divide-y divide-line text-sm">
          @for (transaction of transactions(); track transaction.id) {
            <li class="flex items-center justify-between gap-4 py-2">
              <span class="truncate">{{ transaction.description }}</span>
              <span class="whitespace-nowrap font-mono font-semibold" [class.text-primary]="transaction.amount > 0">
                {{ transaction.amount > 0 ? '+' : '−' }}{{ abs(transaction.amount) | currency: 'USD' : 'symbol' : '1.0-0' }}
              </span>
            </li>
          } @empty {
            <li class="py-2 text-muted">No payments yet.</li>
          }
        </ul>
      </section>
    </div>

    <section class="sb-card mt-6 p-0" data-testid="recent-flights">
      <div class="flex items-baseline justify-between px-6 pt-5">
        <p class="font-mono text-[10px] tracking-[0.2em] text-muted">RECENT FLIGHTS</p>
        <a routerLink="/logbook" class="text-xs text-muted hover:text-primary">Logbook →</a>
      </div>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full text-sm">
          <tbody class="divide-y divide-line border-t border-line">
            @for (flight of logbook()?.flights?.items ?? []; track flight.id) {
              <tr>
                <td class="whitespace-nowrap px-6 py-3 font-mono text-muted">{{ flight.arrivedAtUtc | date: 'dd MMM' : 'UTC' }}</td>
                <td class="whitespace-nowrap px-4 py-3 font-mono font-semibold">{{ flight.origin }} → {{ flight.destination }}</td>
                <td class="px-4 py-3 font-mono">{{ flight.aircraft }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ time(flight.flightMinutes) }}</td>
                <td class="px-6 py-3 text-right"><sb-pirep-status [status]="flight.status" /></td>
              </tr>
            } @empty {
              <tr>
                <td class="px-6 py-6 text-center text-muted">Your flights will show up here.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class Cockpit {
  readonly firstName = input.required<string>();

  protected readonly pilot = signal<Pilot | null>(null);
  protected readonly booking = signal<Booking | null>(null);
  protected readonly logbook = signal<Logbook | null>(null);
  protected readonly transactions = signal<PilotTransaction[]>([]);
  protected readonly askNetworks = signal(false);
  protected readonly time = durationLabel;
  protected readonly route = bookingRoute;
  protected readonly abs = Math.abs;

  constructor() {
    const ignore = () => undefined;
    inject(PilotService).get().pipe(takeUntilDestroyed()).subscribe({
      next: pilot => {
        this.pilot.set(pilot);
        this.askNetworks.set(pilot.vatsimId === null && pilot.ivaoId === null && !postponed());
      },
      error: ignore
    });
    inject(PilotService).transactions(1, RECENT).pipe(takeUntilDestroyed())
      .subscribe({ next: page => this.transactions.set(page.items), error: ignore });
    inject(BookingService).current().pipe(takeUntilDestroyed()).subscribe({ next: booking => this.booking.set(booking), error: ignore });
    inject(PirepService).logbook('all', 1, RECENT).pipe(takeUntilDestroyed())
      .subscribe({ next: logbook => this.logbook.set(logbook), error: ignore });
  }
}

function postponed(): boolean {
  try {
    return localStorage.getItem(NETWORK_PROMPT_KEY) === 'later';
  } catch {
    return false;
  }
}