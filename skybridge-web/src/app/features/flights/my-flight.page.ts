import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Booking } from '../../core/bookings/booking.models';
import { BookingService } from '../../core/bookings/booking.service';
import { problemMessages } from '../../core/http/problem';
import { PirepFiled } from '../../core/pireps/pirep.models';
import { JobBriefing } from '../../shared/freelance/job-briefing';
import { expiresIn, missionLabel, routeOf } from '../../shared/freelance/missions';
import { durationLabel } from '../../shared/time/utc';
import { PirepForm } from './pirep-form';

@Component({
  selector: 'sb-my-flight-page',
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, JobBriefing, PirepForm],
  template: `
    <p class="font-mono text-xs tracking-[0.2em] text-primary">FLIGHTS</p>
    <h1 class="mt-1 font-display text-3xl font-bold">My flight</h1>

    @if (error(); as message) {
      <p class="sb-error mt-4" data-testid="flight-error">{{ message }}</p>
    }

        @if (notice(); as message) {
      <p class="sb-success mt-4" data-testid="flight-notice">{{ message }}</p>
    }

    @if (completed(); as result) {
      <section class="sb-card mt-6 text-center" data-testid="mission-complete">
        <p class="font-mono text-xs tracking-[0.2em] text-primary">MISSION COMPLETE</p>
        <p class="mt-2 font-mono text-xl font-semibold">{{ result.pirep.origin }} → {{ result.pirep.destination }}</p>
        @if (result.rewardPaid !== null) {
          <p class="mt-3 text-lg"><span class="font-mono font-semibold text-primary">+{{ result.rewardPaid | currency: 'USD' : 'symbol' : '1.0-0' }}</span> added to your balance</p>
        } @else {
          <p class="mt-3 text-muted">A PIREP of this mission is waiting for staff review. The reward is paid once it's approved.</p>
        }
        <p class="mt-1 text-sm text-muted">
          You are now at <span class="font-mono">{{ result.pilot.location?.code }}</span> ·
          {{ flightTime(result.pilot.flightMinutes) }} flown ·
          balance {{ result.pilot.balance | currency: 'USD' : 'symbol' : '1.0-0' }}
        </p>
        <a routerLink="/freelance" class="sb-btn-primary mt-5 inline-block w-auto px-5">Find another job</a>
      </section>
    }

    @if (booking(); as current) {
      @if (current.job; as job) {
        <section class="sb-card mt-6" data-testid="flight">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span class="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">{{ label(job.kind) }}</span>
              <p class="mt-3 font-mono text-xl font-semibold">{{ route(job) }}</p>
              <p class="text-sm text-muted">{{ job.client ?? job.destinationName }} · <span class="font-mono">{{ current.aircraft }}</span></p>
            </div>
            <div class="text-right">
              <p class="font-mono text-xl font-semibold text-primary">{{ job.reward | currency: 'USD' : 'symbol' : '1.0-0' }}</p>
              <p class="text-xs text-muted">paid after the last leg</p>
            </div>
          </div>

          <p class="mt-4 text-sm" data-testid="flight-status">
            @if (current.legInProgress) {
              <span class="font-semibold text-primary">Leg {{ current.currentLeg }} of {{ current.legCount }} in progress</span>
              <span class="text-muted"> · since {{ current.legStartedAtUtc | date: 'HH:mm' : 'UTC' }} UTC</span>
            } @else if (current.startedAtUtc) {
              <span class="font-semibold">Ready for leg {{ current.currentLeg }} of {{ current.legCount }}</span>
            } @else {
              <span class="font-semibold">Not started</span>
              <span class="text-muted"> · start within {{ timeLeft(current.startDeadlineUtc) }}</span>
            }
          </p>

          <ol class="mt-4 space-y-2" data-testid="legs">
            @for (leg of job.legs; track leg.sequence) {
              <li class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-4 py-3 text-sm"
                [class.border-primary]="leg.sequence === current.currentLeg"
                [class.border-line]="leg.sequence !== current.currentLeg"
                [class.opacity-50]="leg.sequence < current.currentLeg"
                [attr.data-testid]="'leg-' + leg.sequence">
                <span class="w-14 font-mono text-xs text-muted">LEG {{ leg.sequence }}</span>
                <span class="font-mono font-semibold">{{ leg.origin }} → {{ leg.destination }}</span>
                <span class="font-mono text-muted">{{ leg.distanceNm | number }} nm</span>
                <span class="font-mono text-muted">{{ leg.passengerCount | number }} pax · {{ leg.cargoKg | number }} kg</span>
                @if (leg.sequence < current.currentLeg) {
                  <span class="ml-auto text-xs uppercase tracking-wide text-muted">Done</span>
                } @else if (leg.sequence === current.currentLeg) {
                  <span class="ml-auto text-xs uppercase tracking-wide text-primary">{{ current.legInProgress ? 'Flying' : 'Next' }}</span>
                }
              </li>
            }
          </ol>

          <div class="mt-5 flex flex-wrap items-center gap-3">
            @if (current.legInProgress) {
              <p class="text-sm text-muted" data-testid="pirep-hint">Land at {{ currentDestination() }} and file the PIREP below to finish this leg.</p>
            } @else {
              <button type="button" class="sb-btn-primary w-auto px-5" [disabled]="busy()" (click)="startLeg()" data-testid="start-leg">
                Start leg {{ current.currentLeg }}
              </button>
            }

            <span class="ml-auto">
              @if (confirmingCancel()) {
                <span class="mr-2 text-sm text-muted">Cancel this flight? The job goes back to the board.</span>
                <button type="button" class="sb-btn-danger px-3 py-1" [disabled]="busy()" (click)="cancel()" data-testid="confirm-cancel">Yes, cancel</button>
                <button type="button" class="ml-2 text-sm text-muted hover:text-foreground" (click)="confirmingCancel.set(false)">Keep flying</button>
              } @else {
                <button type="button" class="text-sm text-muted hover:text-primary" (click)="confirmingCancel.set(true)" data-testid="cancel-flight">Cancel flight</button>
              }
            </span>
          </div>

          @if (current.legInProgress) {
            <div class="mt-5">
              <sb-pirep-form [booking]="current" (filed)="onFiled($event)" />
            </div>
          }
        </section>

        <section class="sb-card mt-6">
          <h2 class="mb-4 text-lg font-semibold">Briefing</h2>
          <sb-job-briefing [job]="job" />
        </section>
      }
    } @else if (!loading() && !completed()) {
      <section class="sb-card mt-6 py-10 text-center" data-testid="no-flight">
        <p class="text-muted">You have no active flight.</p>
        <a routerLink="/freelance" class="sb-btn-primary mt-4 inline-block w-auto px-5">Find a freelance job</a>
      </section>
    }
  `
})
export class MyFlightPage {
  private readonly bookings = inject(BookingService);

  protected readonly booking = signal<Booking | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmingCancel = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly completed = signal<PirepFiled | null>(null);
  protected readonly currentDestination = computed(() => {
    const current = this.booking();
    return current?.job?.legs.find(leg => leg.sequence === current.currentLeg)?.destination ?? '';
  });

  protected readonly label = missionLabel;
  protected readonly flightTime = durationLabel;
  protected readonly route = routeOf;

  constructor() {
    this.bookings.current().pipe(takeUntilDestroyed()).subscribe({
      next: booking => {
        this.loading.set(false);
        this.booking.set(booking);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }

  protected onFiled(result: PirepFiled): void {
    this.booking.set(result.booking);
    if (result.booking) {
      const review = result.pirep.status === 'Pending' ? ' It is waiting for staff review.' : '';
      this.notice.set(`Leg ${result.pirep.leg} filed. You are now at ${result.pirep.destination}.${review}`);
    } else {
      this.notice.set(null);
      this.completed.set(result);
    }
  }

  protected startLeg(): void {
    this.notice.set(null);
    this.run(this.bookings.startLeg(), booking => this.booking.set(booking));
  }

  protected cancel(): void {
    this.run(this.bookings.cancel(), () => {
      this.confirmingCancel.set(false);
      this.booking.set(null);
    });
  }

  protected timeLeft(deadline: string): string {
    return expiresIn(deadline);
  }

  private run<T>(request: Observable<T>, done: (value: T) => void): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: value => {
        this.busy.set(false);
        done(value);
      },
      error: error => {
        this.busy.set(false);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }
}