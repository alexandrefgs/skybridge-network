import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import { Booking } from '../../core/bookings/booking.models';
import { BookingService } from '../../core/bookings/booking.service';
import { FreelanceJob, FreelanceQuery } from '../../core/freelance/freelance.models';
import { FREELANCE_PAGE_SIZE, FreelanceService } from '../../core/freelance/freelance.service';
import { PagedResult } from '../../core/http/paged-result';
import { problemMessages } from '../../core/http/problem';
import { Pilot } from '../../core/pilot/pilot.models';
import { PilotService } from '../../core/pilot/pilot.service';
import { JobBriefing } from '../../shared/freelance/job-briefing';
import { expiresIn, hasDangerousGoods, maxCargo, maxPassengers, missionLabel, routeOf } from '../../shared/freelance/missions';
import { durationLabel } from '../../shared/time/utc';

@Component({
  selector: 'sb-freelance-page',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DecimalPipe, JobBriefing],
  template: `
    <p class="font-mono text-xs tracking-[0.2em] text-primary">FLIGHTS</p>
    <h1 class="mt-1 font-display text-3xl font-bold">Freelance</h1>
    <p class="mt-1 text-muted">Charter, cargo and special missions. Build your hours here before joining an airline.</p>

    @if (booking(); as active) {
      <section class="sb-card mt-6 flex flex-wrap items-center justify-between gap-4 border-primary/50" data-testid="active-flight">
        <div>
          <p class="text-xs uppercase tracking-wide text-primary">Active flight</p>
          <p class="mt-1 font-mono font-semibold">{{ active.job ? route(active.job) : '—' }} · {{ active.aircraft }}</p>
          <p class="text-sm text-muted">Finish or cancel it before taking another job or a jumpseat.</p>
        </div>
        <a routerLink="/flight" class="sb-btn-primary w-auto px-5">Go to my flight</a>
      </section>
    }
    @if (pilot(); as current) {
      <section class="sb-card mt-6" data-testid="location">
        @if (current.location; as location) {
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">You are at</p>
              <p class="mt-1 text-lg font-semibold">
                <span class="font-mono text-primary">{{ location.code }}</span> {{ location.name }}
              </p>
              <p class="text-sm text-muted">{{ location.municipality ?? '—' }}, {{ location.countryCode }} · <span data-testid="flight-time">{{ flightTime(current.flightMinutes) }}</span> flown · <span data-testid="balance">{{ current.balance | currency: 'USD' : 'symbol' : '1.0-0' }}</span></p>
            </div>
            @if (!jumpseatOpen() && !booking()) {
              <button type="button" class="sb-btn-secondary w-auto px-4" (click)="jumpseatOpen.set(true)" data-testid="open-jumpseat">Jumpseat</button>
            }
          </div>
        } @else {
          <h2 class="text-lg font-semibold">Choose where your career starts</h2>
          <p class="mt-1 text-sm text-muted">Pick any airport. After that you move by flying, or with a free jumpseat.</p>
        }

        @if (!current.location || jumpseatOpen()) {
          <form class="mt-4 flex flex-wrap items-start gap-3" (submit)="jumpseat($event)" data-testid="jumpseat-form">
            <input class="sb-input w-40 font-mono uppercase" placeholder="SBFL" maxlength="10" [formControl]="airportControl" data-testid="jumpseat-airport">
            <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="moving()">
              {{ current.location ? 'Jumpseat (free)' : 'Start here' }}
            </button>
            @if (current.location) {
              <button type="button" class="sb-btn-ghost w-auto" (click)="jumpseatOpen.set(false)">Cancel</button>
            }
          </form>
        }
        @if (locationError(); as message) {
          <p class="sb-error mt-3" data-testid="location-error">{{ message }}</p>
        }
      </section>
    }

    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        Available jobs <span class="text-sm font-normal text-muted" data-testid="job-count">· {{ result()?.totalCount ?? 0 | number }}</span>
      </h2>
      @if (pilot()?.location) {
        <label class="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" class="accent-primary" [checked]="onlyHere()" (change)="setOnlyHere($any($event.target).checked)" data-testid="only-here">
          Only from {{ pilot()!.location!.code }}
        </label>
      }
    </div>

    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    <div class="mt-4 space-y-3" data-testid="jobs">
      @for (job of result()?.items ?? []; track job.id) {
        <article class="sb-card p-0" [attr.data-testid]="'job-' + job.id">
          <button type="button" class="flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-left" (click)="toggle(job.id)">
            <span class="w-28 shrink-0 rounded-full border border-line px-2.5 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted">{{ label(job.kind) }}</span>
            <span class="min-w-0 flex-1">
              <span class="font-mono font-semibold">{{ route(job) }}</span>
              <span class="block truncate text-xs text-muted">{{ job.client ?? job.destinationName }}</span>
            </span>
            <span class="font-mono text-sm text-muted">{{ job.distanceNm | number }} nm@if (job.legs.length > 1) { · {{ job.legs.length }} legs}</span>
            <span class="font-mono text-sm text-muted">{{ passengers(job) | number }} pax · {{ cargo(job) | number }} kg</span>
            @if (dangerous(job)) {
              <span class="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-500" data-testid="dg-badge">DG</span>
            }
            <span class="font-mono text-xs text-muted">{{ job.aircraft.join(' ') }}</span>
            <span class="ml-auto text-right">
              <span class="block font-mono font-semibold text-primary">{{ job.reward | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
              <span class="block text-xs text-muted">expires in {{ timeLeft(job.expiresAtUtc) }}</span>
            </span>
          </button>
          @if (expanded() === job.id) {
            <div class="border-t border-line px-5 py-5">
              <sb-job-briefing [job]="job" />
              <div class="mt-5 border-t border-line pt-4" data-testid="accept">
                @if (booking()) {
                  <p class="text-sm text-muted">You already have an active flight.</p>
                } @else if (pilot()?.location?.code !== job.origin) {
                  <p class="text-sm text-muted">This job departs from {{ job.origin }}. Take a free jumpseat there to accept it.</p>
                } @else {
                  <form class="flex flex-wrap items-center gap-3" (submit)="accept($event, job)" data-testid="accept-form">
                    <label class="text-sm text-muted" for="accept-aircraft">Aircraft</label>
                    <select id="accept-aircraft" class="sb-input w-32 font-mono" [formControl]="aircraftControl" data-testid="accept-aircraft">
                      @for (code of job.aircraft; track code) {
                        <option [value]="code">{{ code }}</option>
                      }
                    </select>
                    <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="accepting()" data-testid="accept-job">Accept job</button>
                  </form>
                }
                @if (acceptError(); as message) {
                  <p class="sb-error mt-3" data-testid="accept-error">{{ message }}</p>
                }
              </div>
            </div>
          }
        </article>
      } @empty {
        @if (!loading()) {
          <p class="sb-card py-10 text-center text-sm text-muted" data-testid="no-jobs">
            {{ onlyHere() ? 'No jobs leaving from here right now. Try a jumpseat or show jobs from everywhere.' : 'No jobs available right now.' }}
          </p>
        }
      }
    </div>

    @if (totalPages() > 1) {
      <div class="mt-4 flex items-center justify-between text-sm">
        <button type="button" class="text-muted hover:text-primary disabled:opacity-40" [disabled]="query().page <= 1" (click)="goToPage(query().page - 1)" data-testid="jobs-previous">← Previous</button>
        <span class="text-muted">Page {{ query().page }} of {{ totalPages() }}</span>
        <button type="button" class="text-muted hover:text-primary disabled:opacity-40" [disabled]="query().page >= totalPages()" (click)="goToPage(query().page + 1)" data-testid="jobs-next">Next →</button>
      </div>
    }
  `
})
export class FreelancePage {
  private readonly pilots = inject(PilotService);
  private readonly jobs = inject(FreelanceService);
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly airportControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  protected readonly aircraftControl = new FormControl('', { nonNullable: true });
  protected readonly pilot = signal<Pilot | null>(null);
  protected readonly booking = signal<Booking | null>(null);
  protected readonly flightTime = durationLabel;
  protected readonly accepting = signal(false);
  protected readonly acceptError = signal<string | null>(null);
  protected readonly jumpseatOpen = signal(false);
  protected readonly moving = signal(false);
  protected readonly locationError = signal<string | null>(null);
  protected readonly onlyHere = signal(true);
  protected readonly query = signal<FreelanceQuery>({ from: null, page: 1 });
  protected readonly result = signal<PagedResult<FreelanceJob> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly expanded = signal<number | null>(null);
  protected readonly totalPages = computed(() => Math.ceil((this.result()?.totalCount ?? 0) / FREELANCE_PAGE_SIZE));

  protected readonly label = missionLabel;
  protected readonly route = routeOf;
  protected readonly passengers = maxPassengers;
  protected readonly cargo = maxCargo;
  protected readonly dangerous = hasDangerousGoods;

  constructor() {
    this.pilots.get().pipe(takeUntilDestroyed()).subscribe(pilot => this.setPilot(pilot));
    this.bookings.current().pipe(takeUntilDestroyed()).subscribe(booking => this.booking.set(booking));

    toObservable(this.query)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(query =>
          this.jobs.search(query).pipe(
            catchError(error => {
              this.error.set(problemMessages(error)[0]);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(result => {
        this.loading.set(false);
        if (result) this.result.set(result);
      });
  }

  protected jumpseat(event: Event): void {
    event.preventDefault();
    const airport = this.airportControl.value.trim().toUpperCase();
    if (!airport) return;

    this.moving.set(true);
    this.locationError.set(null);
    this.pilots.jumpseat(airport).subscribe({
      next: pilot => {
        this.moving.set(false);
        this.jumpseatOpen.set(false);
        this.airportControl.reset();
        this.setPilot(pilot);
      },
      error: error => {
        this.moving.set(false);
        this.locationError.set(problemMessages(error)[0]);
      }
    });
  }

  protected setOnlyHere(value: boolean): void {
    this.onlyHere.set(value);
    this.query.set({ from: value ? (this.pilot()?.location?.code ?? null) : null, page: 1 });
  }

  protected toggle(id: number): void {
    this.expanded.update(current => (current === id ? null : id));
    this.acceptError.set(null);
    const job = this.result()?.items.find(j => j.id === id);
    this.aircraftControl.setValue(job?.aircraft[0] ?? '');
  }

  protected accept(event: Event, job: FreelanceJob): void {
    event.preventDefault();
    const aircraft = this.aircraftControl.value;
    if (!aircraft) return;

    this.accepting.set(true);
    this.acceptError.set(null);
    this.bookings.acceptFreelance(job.id, aircraft).subscribe({
      next: () => {
        this.accepting.set(false);
        this.router.navigateByUrl('/flight');
      },
      error: error => {
        this.accepting.set(false);
        this.acceptError.set(problemMessages(error)[0]);
      }
    });
  }

  protected goToPage(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }

  protected timeLeft(expiresAtUtc: string): string {
    return expiresIn(expiresAtUtc);
  }

  private setPilot(pilot: Pilot): void {
    this.pilot.set(pilot);
    const from = this.onlyHere() ? (pilot.location?.code ?? null) : null;
    if (from !== this.query().from) this.query.set({ from, page: 1 });
  }
}