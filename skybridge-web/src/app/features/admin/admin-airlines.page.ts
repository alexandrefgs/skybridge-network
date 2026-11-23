import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AdminAirlinesService } from '../../core/admin/admin-airlines.service';
import { Airline, AirlineInput, AirlineQuery } from '../../core/airlines/airline.models';
import { AIRLINES_PAGE_SIZE, AirlinesService } from '../../core/airlines/airlines.service';
import { PagedResult } from '../../core/http/paged-result';
import { problemMessages } from '../../core/http/problem';
import { AirlineForm } from './airline-form';

@Component({
  selector: 'sb-admin-airlines-page',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, AirlineForm],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-4">
        <input class="sb-input w-72" type="search" placeholder="Search name, ICAO, IATA or country" [formControl]="searchControl" data-testid="search">
        <label class="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" class="accent-primary" [checked]="query().active" (change)="setActiveOnly($any($event.target).checked)" data-testid="active-only">
          Hide retro
        </label>
      </div>
      <button type="button" class="sb-btn-primary w-auto px-4" (click)="creating.set(true); formErrors.set([])" data-testid="new-airline">New airline</button>
    </div>

    @if (creating()) {
      <div class="sb-card mt-6 p-6">
        <h2 class="mb-4 text-lg font-semibold">New airline</h2>
        <sb-airline-form [errors]="formErrors()" [saving]="saving()" (saved)="create($event)" (cancelled)="creating.set(false)" />
      </div>
    }

    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    <div class="sb-card mt-6 overflow-x-auto p-0">
      <table class="w-full text-sm" data-testid="airlines">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">ICAO</th>
            <th class="px-4 py-3 font-medium">IATA</th>
            <th class="px-4 py-3 font-medium">Airline</th>
            <th class="px-4 py-3 font-medium">Country</th>
            <th class="px-4 py-3 text-right font-medium">Routes</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (airline of result()?.items ?? []; track airline.id) {
            <tr>
              <td class="px-4 py-3 font-mono font-semibold">{{ airline.icaoCode ?? '—' }}</td>
              <td class="px-4 py-3 font-mono text-muted">{{ airline.iataCode ?? '—' }}</td>
              <td class="px-4 py-3">
                {{ airline.name }}
                @if (!airline.isActive) {
                  <span class="ml-2 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-500" data-testid="retro">Retro</span>
                }
              </td>
              <td class="px-4 py-3 text-muted">{{ airline.country ?? '—' }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ airline.routeCount | number }}</td>
              <td class="px-4 py-3 text-right">
                <a [routerLink]="[airline.id]" class="text-muted transition-colors hover:text-primary" [attr.data-testid]="'manage-' + airline.id">Manage</a>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="px-4 py-10 text-center text-muted">No airlines found.</td>
            </tr>
          }
        </tbody>
      </table>

      @if (totalPages() > 1) {
        <div class="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page <= 1" (click)="goToPage(query().page - 1)">← Previous</button>
          <span class="text-muted">Page {{ query().page }} of {{ totalPages() | number }}</span>
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page >= totalPages()" (click)="goToPage(query().page + 1)">Next →</button>
        </div>
      }
    </div>
  `
})
export class AdminAirlinesPage {
  private readonly airlines = inject(AirlinesService);
  private readonly admin = inject(AdminAirlinesService);
  private readonly router = inject(Router);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly query = signal<AirlineQuery>({ search: '', active: true, page: 1, pageSize: AIRLINES_PAGE_SIZE });
  protected readonly result = signal<PagedResult<Airline> | null>(null);
  protected readonly totalPages = computed(() => Math.ceil((this.result()?.totalCount ?? 0) / this.query().pageSize));
  protected readonly creating = signal(false);
  protected readonly saving = signal(false);
  protected readonly formErrors = signal<string[]>([]);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), map(value => value.trim()), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(search => this.query.update(q => ({ ...q, search, page: 1 })));

    toObservable(this.query)
      .pipe(
        switchMap(query =>
          this.airlines.search(query).pipe(
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

  protected create(airline: AirlineInput): void {
    this.saving.set(true);
    this.formErrors.set([]);
    this.admin.create(airline).subscribe({
      next: created => {
        this.saving.set(false);
        this.router.navigate(['/admin/airlines', created.id]);
      },
      error: error => {
        this.saving.set(false);
        this.formErrors.set(problemMessages(error));
      }
    });
  }

  protected setActiveOnly(activeOnly: boolean): void {
    this.query.update(q => ({ ...q, active: activeOnly ? true : null, page: 1 }));
  }

  protected goToPage(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }
}