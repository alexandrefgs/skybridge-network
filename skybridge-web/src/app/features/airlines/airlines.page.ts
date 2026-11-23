import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { Airline, AirlineQuery } from '../../core/airlines/airline.models';
import { AIRLINES_PAGE_SIZE, AirlinesService } from '../../core/airlines/airlines.service';
import { PagedResult } from '../../core/http/paged-result';
import { problemMessages } from '../../core/http/problem';
import { DataCredits } from '../../shared/data/data-credits';

@Component({
  selector: 'sb-airlines-page',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, DataCredits],
  template: `
    <p class="font-mono text-xs tracking-[0.2em] text-primary">CATALOG</p>
    <h1 class="mt-1 font-display text-3xl font-bold">Airlines</h1>
    <p class="mt-1 text-muted">Real airlines, their fleets and the routes you can fly with them.</p>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        {{ query().active ? 'Active airlines' : 'All airlines' }}
        <span class="ml-1 text-sm font-normal text-muted" data-testid="count">· {{ totalCount() | number }}</span>
      </h2>
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" class="accent-primary" [checked]="query().active" (change)="setActiveOnly($any($event.target).checked)" data-testid="active-only">
          Active only
        </label>
        <input class="sb-input w-72" type="search" placeholder="Search name, ICAO, IATA or country" [formControl]="searchControl" data-testid="search">
      </div>
    </div>

    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    <div class="sb-card mt-4 overflow-x-auto p-0">
      <table class="w-full text-sm" data-testid="airlines">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">ICAO</th>
            <th class="px-4 py-3 font-medium">IATA</th>
            <th class="px-4 py-3 font-medium">Airline</th>
            <th class="px-4 py-3 font-medium">Callsign</th>
            <th class="px-4 py-3 font-medium">Country</th>
            <th class="px-4 py-3 text-right font-medium">Routes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (airline of result()?.items ?? []; track airline.id) {
            <tr class="transition-colors hover:bg-surface-2">
              <td class="px-4 py-3 font-mono font-semibold">{{ airline.icaoCode ?? '—' }}</td>
              <td class="px-4 py-3 font-mono text-muted">{{ airline.iataCode ?? '—' }}</td>
              <td class="px-4 py-3">
                <a [routerLink]="['/airlines', airline.id]" class="font-medium transition-colors hover:text-primary" [attr.data-testid]="'airline-' + airline.id">{{ airline.name }}</a>
                @if (!airline.isActive) {
                  <span class="ml-2 rounded border border-line px-1.5 py-0.5 text-xs text-muted">Inactive</span>
                }
              </td>
              <td class="px-4 py-3 font-mono text-xs text-muted">{{ airline.callsign ?? '—' }}</td>
              <td class="px-4 py-3 text-muted">{{ airline.country ?? '—' }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ airline.routeCount | number }}</td>
            </tr>
          } @empty {
            @if (!loading()) {
              <tr>
                <td colspan="6" class="px-4 py-10 text-center text-muted" data-testid="empty">No airlines found.</td>
              </tr>
            }
          }
        </tbody>
      </table>

      @if (totalPages() > 1) {
        <div class="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page <= 1 || loading()" (click)="goToPage(query().page - 1)" data-testid="previous">← Previous</button>
          <span class="text-muted" data-testid="page">Page {{ query().page }} of {{ totalPages() | number }}</span>
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page >= totalPages() || loading()" (click)="goToPage(query().page + 1)" data-testid="next">Next →</button>
        </div>
      }
    </div>

    <sb-data-credits />
  `
})
export class AirlinesPage {
  private readonly airlines = inject(AirlinesService);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly query = signal<AirlineQuery>({ search: '', active: true, page: 1, pageSize: AIRLINES_PAGE_SIZE });
  protected readonly result = signal<PagedResult<Airline> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalCount = computed(() => this.result()?.totalCount ?? 0);
  protected readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.query().pageSize));

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), map(value => value.trim()), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(search => this.query.update(q => ({ ...q, search, page: 1 })));

    toObservable(this.query)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
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
        this.loading.set(false);
        if (result) this.result.set(result);
      });
  }

  protected setActiveOnly(activeOnly: boolean): void {
    this.query.update(q => ({ ...q, active: activeOnly ? true : null, page: 1 }));
  }

  protected goToPage(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }
}