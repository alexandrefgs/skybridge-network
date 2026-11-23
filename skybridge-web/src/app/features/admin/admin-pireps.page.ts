import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { PagedResult } from '../../core/http/paged-result';
import { problemMessages } from '../../core/http/problem';
import { Pirep, PirepStatus } from '../../core/pireps/pirep.models';
import { AdminPirepService, PIREP_PAGE_SIZE } from '../../core/pireps/pirep.service';
import { durationLabel } from '../../shared/time/utc';

interface PirepQuery {
  status: PirepStatus | null;
  page: number;
}

@Component({
  selector: 'sb-admin-pireps-page',
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted">PIREPs with unusual times wait here. Approving adds the hours and pays the reward when the mission is done.</p>
      <div class="flex gap-1 text-sm" data-testid="pirep-filters">
        @for (filter of filters; track filter.label) {
          <button type="button" class="rounded-md px-3 py-1.5"
            [class.bg-primary]="query().status === filter.status" [class.text-primary-foreground]="query().status === filter.status"
            [class.text-muted]="query().status !== filter.status"
            (click)="setStatus(filter.status)" [attr.data-testid]="'filter-' + filter.label.toLowerCase()">{{ filter.label }}</button>
        }
      </div>
    </div>

    @if (notice(); as message) {
      <p class="sb-success mt-4" data-testid="notice">{{ message }}</p>
    }
    @if (error(); as message) {
      <p class="sb-error mt-4" data-testid="error">{{ message }}</p>
    }

    <div class="mt-6 space-y-3" data-testid="pireps">
      @for (pirep of result()?.items ?? []; track pirep.id) {
        <article class="sb-card" [attr.data-testid]="'pirep-' + pirep.id">
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span class="font-mono text-xs text-muted">#{{ pirep.id }}</span>
            <span class="min-w-0 flex-1">
              <span class="font-mono font-semibold">{{ pirep.origin }} → {{ pirep.destination }}</span>
              <span class="text-xs text-muted"> · leg {{ pirep.leg }}/{{ pirep.legCount }} · {{ pirep.aircraft }}</span>
              <span class="block text-xs text-muted">{{ pirep.pilot }} · filed {{ pirep.filedAtUtc | date: 'dd MMM HH:mm' : 'UTC' }} UTC</span>
            </span>
            <span class="font-mono text-sm">{{ pirep.distanceNm | number }} nm · {{ duration(pirep.flightMinutes) }}</span>
            <span class="font-mono text-sm text-muted">
              {{ pirep.departedAtUtc | date: 'HH:mm' : 'UTC' }}–{{ pirep.arrivedAtUtc | date: 'HH:mm' : 'UTC' }}Z
              @if (pirep.landingRateFpm !== null) { · {{ pirep.landingRateFpm }} fpm }
            </span>
            <span class="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              [class.border-amber-500]="pirep.status === 'Pending'" [class.text-amber-500]="pirep.status === 'Pending'"
              [class.border-line]="pirep.status !== 'Pending'" [class.text-muted]="pirep.status !== 'Pending'"
              [attr.data-testid]="'status-' + pirep.id">{{ pirep.status }}</span>
          </div>

          @if (pirep.flag) {
            <p class="mt-3 text-sm text-amber-500" [attr.data-testid]="'flag-' + pirep.id">⚠ {{ pirep.flag }}</p>
          }
          @if (pirep.remarks) {
            <p class="mt-2 text-sm text-muted">“{{ pirep.remarks }}”</p>
          }
          @if (pirep.reviewNote) {
            <p class="mt-2 text-sm">Staff: {{ pirep.reviewNote }}</p>
          }

          @if (pirep.status === 'Pending') {
            <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <input class="sb-input min-w-60 flex-1" maxlength="300" placeholder="Note to the pilot (required to reject)"
                [value]="notes()[pirep.id] ?? ''" (input)="setNote(pirep.id, $any($event.target).value)" [attr.data-testid]="'note-' + pirep.id">
              <button type="button" class="sb-btn-primary w-auto px-4" [disabled]="busy()" (click)="approve(pirep)" [attr.data-testid]="'approve-' + pirep.id">Approve</button>
              <button type="button" class="sb-btn-danger w-auto px-4" [disabled]="busy()" (click)="reject(pirep)" [attr.data-testid]="'reject-' + pirep.id">Reject</button>
            </div>
          }
        </article>
      } @empty {
        @if (!loading()) {
          <p class="sb-card py-10 text-center text-sm text-muted" data-testid="no-pireps">
            {{ query().status === 'Pending' ? 'Nothing to review.' : 'No PIREPs yet.' }}
          </p>
        }
      }
    </div>

    @if (totalPages() > 1) {
      <div class="mt-4 flex items-center justify-between text-sm">
        <button type="button" class="text-muted hover:text-primary disabled:opacity-40" [disabled]="query().page <= 1" (click)="goToPage(query().page - 1)">← Previous</button>
        <span class="text-muted">Page {{ query().page }} of {{ totalPages() }}</span>
        <button type="button" class="text-muted hover:text-primary disabled:opacity-40" [disabled]="query().page >= totalPages()" (click)="goToPage(query().page + 1)">Next →</button>
      </div>
    }
  `
})
export class AdminPirepsPage {
  private readonly pireps = inject(AdminPirepService);

  protected readonly filters: { label: string; status: PirepStatus | null }[] = [
    { label: 'Pending', status: 'Pending' },
    { label: 'Accepted', status: 'Accepted' },
    { label: 'Rejected', status: 'Rejected' },
    { label: 'All', status: null }
  ];
  protected readonly query = signal<PirepQuery>({ status: 'Pending', page: 1 });
  protected readonly result = signal<PagedResult<Pirep> | null>(null);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly notes = signal<Record<number, string>>({});
  protected readonly totalPages = computed(() => Math.ceil((this.result()?.totalCount ?? 0) / PIREP_PAGE_SIZE));
  protected readonly duration = durationLabel;

  constructor() {
    toObservable(this.query)
      .pipe(
        switchMap(query => {
          this.loading.set(true);
          return this.pireps.search(query.status, query.page).pipe(
            catchError(error => {
              this.error.set(problemMessages(error)[0]);
              return of(null);
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(result => {
        this.loading.set(false);
        if (result) this.result.set(result);
      });
  }

  protected setStatus(status: PirepStatus | null): void {
    this.query.set({ status, page: 1 });
  }

  protected goToPage(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }

  protected setNote(id: number, note: string): void {
    this.notes.update(notes => ({ ...notes, [id]: note }));
  }

  protected approve(pirep: Pirep): void {
    const note = this.notes()[pirep.id]?.trim() || null;
    this.review(this.pireps.approve(pirep.id, note), `PIREP #${pirep.id} approved.`);
  }

  protected reject(pirep: Pirep): void {
    const note = this.notes()[pirep.id]?.trim();
    if (!note) {
      this.error.set('Write a note telling the pilot why the PIREP was rejected.');
      return;
    }
    this.review(this.pireps.reject(pirep.id, note), `PIREP #${pirep.id} rejected.`);
  }

  private review(request: ReturnType<AdminPirepService['approve']>, message: string): void {
    this.busy.set(true);
    this.error.set(null);
    this.notice.set(null);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.notice.set(message);
        this.query.update(q => ({ ...q }));
      },
      error: error => {
        this.busy.set(false);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }
}