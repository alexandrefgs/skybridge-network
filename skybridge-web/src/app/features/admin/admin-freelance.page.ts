import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { AircraftService } from '../../core/aircraft/aircraft.service';
import { FreelanceJob, FreelanceJobInput, FreelanceQuery } from '../../core/freelance/freelance.models';
import { AdminFreelanceService, FREELANCE_PAGE_SIZE } from '../../core/freelance/freelance.service';
import { PagedResult } from '../../core/http/paged-result';
import { problemMessages } from '../../core/http/problem';
import { expiresIn, missionLabel, routeOf } from '../../shared/freelance/missions';
import { FreelanceJobForm } from './freelance-job-form';

@Component({
  selector: 'sb-admin-freelance-page',
  imports: [CurrencyPipe, FreelanceJobForm],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted">Charter, cargo and special missions that pilots pick up at the origin airport.</p>
      @if (editing() === null) {
        <button type="button" class="sb-btn-primary w-auto px-5" (click)="startCreate()" data-testid="new-job">New job</button>
      }
    </div>

    @if (editing() !== null) {
      <div class="sb-card mt-6">
        <h2 class="mb-4 text-lg font-semibold">{{ editing() === 'new' ? 'New freelance job' : 'Edit job #' + editing() }}</h2>
        <sb-freelance-job-form [job]="editingJob()" [catalog]="catalog()" [errors]="formErrors()" [saving]="saving()"
          (saved)="save($event)" (cancelled)="editing.set(null)" />
      </div>
    }

    @if (notice(); as message) {
      <p class="sb-success mt-4" data-testid="notice">{{ message }}</p>
    }
    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    <div class="sb-card mt-6 overflow-x-auto p-0">
      <table class="w-full text-sm" data-testid="jobs">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">#</th>
            <th class="px-4 py-3 font-medium">Mission</th>
            <th class="px-4 py-3 font-medium">Route</th>
            <th class="px-4 py-3 font-medium">Client</th>
            <th class="px-4 py-3 font-medium">Aircraft</th>
            <th class="px-4 py-3 text-right font-medium">Reward</th>
            <th class="px-4 py-3 font-medium">Expires</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (job of result()?.items ?? []; track job.id) {
            <tr [attr.data-testid]="'job-row-' + job.id" [class.opacity-60]="job.expired">
              <td class="px-4 py-3 font-mono text-muted">{{ job.id }}</td>
              <td class="px-4 py-3">{{ label(job.kind) }}</td>
              <td class="whitespace-nowrap px-4 py-3 font-mono">
                {{ route(job) }}
                @if (job.warnings.length) {
                  <span class="ml-1 text-amber-500" [title]="job.warnings.join('\n')" [attr.data-testid]="'job-warning-' + job.id">⚠</span>
                }
              </td>
              <td class="max-w-48 truncate px-4 py-3 text-muted">{{ job.client ?? '—' }}</td>
              <td class="px-4 py-3 font-mono text-xs">{{ job.aircraft.join(' ') }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ job.reward | currency: 'USD' : 'symbol' : '1.0-0' }}</td>
              <td class="whitespace-nowrap px-4 py-3">
                @if (job.taken) {
                  <span class="mr-2 rounded border border-primary/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary" [attr.data-testid]="'job-taken-' + job.id">Taken</span>
                }
                @if (job.expired) {
                  <span class="text-xs uppercase tracking-wide text-muted">Expired</span>
                } @else {
                  {{ timeLeft(job.expiresAtUtc) }}
                }
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-right">
                @if (confirmingDelete() === job.id) {
                  <span class="mr-2 text-xs text-muted">Delete?</span>
                  <button type="button" class="sb-btn-danger px-3 py-1" (click)="delete(job.id)" data-testid="confirm-delete-job">Delete</button>
                  <button type="button" class="ml-2 text-muted hover:text-foreground" (click)="confirmingDelete.set(null)">Cancel</button>
                } @else {
                  <button type="button" class="text-muted hover:text-primary" (click)="startEdit(job)" [attr.data-testid]="'edit-job-' + job.id">Edit</button>
                  <button type="button" class="ml-4 text-muted hover:text-primary" (click)="confirmingDelete.set(job.id)" [attr.data-testid]="'delete-job-' + job.id">Delete</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="8" class="px-4 py-10 text-center text-muted">No freelance jobs yet.</td></tr>
          }
        </tbody>
      </table>
      @if (totalPages() > 1) {
        <div class="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
          <button type="button" class="text-muted hover:text-primary disabled:opacity-40" [disabled]="query().page <= 1" (click)="goToPage(query().page - 1)">← Previous</button>
          <span class="text-muted">Page {{ query().page }} of {{ totalPages() }}</span>
          <button type="button" class="text-muted hover:text-primary disabled:opacity-40" [disabled]="query().page >= totalPages()" (click)="goToPage(query().page + 1)">Next →</button>
        </div>
      }
    </div>
  `
})
export class AdminFreelancePage {
  private readonly admin = inject(AdminFreelanceService);
  private readonly aircraft = inject(AircraftService);

  protected readonly query = signal<FreelanceQuery>({ from: null, page: 1 });
  protected readonly result = signal<PagedResult<FreelanceJob> | null>(null);
  protected readonly catalog = signal<string[]>([]);
  protected readonly editing = signal<number | 'new' | null>(null);
  protected readonly confirmingDelete = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly formErrors = signal<string[]>([]);
  protected readonly notice = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly totalPages = computed(() => Math.ceil((this.result()?.totalCount ?? 0) / FREELANCE_PAGE_SIZE));
  protected readonly editingJob = computed(() => {
    const id = this.editing();
    return typeof id === 'number' ? (this.result()?.items.find(job => job.id === id) ?? null) : null;
  });

  protected readonly label = missionLabel;
  protected readonly route = routeOf;

  constructor() {
    this.aircraft
      .types({ category: null, search: '', page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed())
      .subscribe(result => this.catalog.set(result.items.map(t => t.icaoCode).sort()));

    toObservable(this.query)
      .pipe(
        switchMap(query =>
          this.admin.search(query).pipe(
            catchError(error => {
              this.error.set(problemMessages(error)[0]);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(result => {
        if (result) this.result.set(result);
      });
  }

  protected startCreate(): void {
    this.formErrors.set([]);
    this.notice.set(null);
    this.editing.set('new');
  }

  protected startEdit(job: FreelanceJob): void {
    this.formErrors.set([]);
    this.notice.set(null);
    this.editing.set(job.id);
  }

  protected save(input: FreelanceJobInput): void {
    const editing = this.editing();
    const request$ = editing === 'new' ? this.admin.create(input) : this.admin.update(editing as number, input);

    this.saving.set(true);
    this.formErrors.set([]);
    request$.subscribe({
      next: job => {
        this.saving.set(false);
        this.editing.set(null);
        this.notice.set(`Job #${job.id} ${editing === 'new' ? 'created' : 'updated'}.`);
        this.reload();
      },
      error: error => {
        this.saving.set(false);
        this.formErrors.set(problemMessages(error));
      }
    });
  }

  protected delete(id: number): void {
    this.confirmingDelete.set(null);
    this.admin.delete(id).subscribe({
      next: () => {
        this.notice.set(`Job #${id} deleted.`);
        this.reload();
      },
      error: error => this.error.set(problemMessages(error)[0])
    });
  }

  protected goToPage(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }

  protected timeLeft(expiresAtUtc: string): string {
    return expiresIn(expiresAtUtc);
  }

  private reload(): void {
    this.query.update(q => ({ ...q }));
  }
}