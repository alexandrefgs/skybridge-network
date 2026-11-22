import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { Airport, AirportQuery, PagedResult } from '../../core/airports/airport.models';
import { AIRPORTS_PAGE_SIZE, AirportsService } from '../../core/airports/airports.service';
import { problemMessages } from '../../core/http/problem';
import { AirportMap } from '../../shared/map/airport-map';

@Component({
  selector: 'sb-airports-page',
  imports: [ReactiveFormsModule, DecimalPipe, AirportMap],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="font-mono text-xs tracking-[0.2em] text-primary">CATALOG</p>
        <h1 class="mt-1 font-display text-3xl font-bold">Airports</h1>
      </div>
      @if (result(); as current) {
        <p class="text-sm text-muted" data-testid="total">{{ current.totalCount | number }} {{ current.totalCount === 1 ? 'airport' : 'airports' }}</p>
      }
    </div>

    <div class="mt-6 grid gap-3 sm:grid-cols-[1fr_8rem]">
      <input class="sb-input" type="search" placeholder="Search by ICAO, IATA, name or city" [formControl]="searchControl" data-testid="search">
      <input class="sb-input uppercase placeholder:normal-case" type="text" maxlength="2" placeholder="Country" [formControl]="countryControl" data-testid="country">
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <section class="sb-card self-start overflow-hidden p-0">
        @if (error(); as message) {
          <p class="sb-error m-4">{{ message }}</p>
        }

        <ul class="divide-y divide-line" data-testid="airport-list">
          @for (airport of result()?.items ?? []; track airport.ident) {
            <li>
              <button type="button" (click)="select(airport)"
                class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                [class.bg-surface-2]="selected()?.ident === airport.ident">
                <span class="w-20 shrink-0 truncate whitespace-nowrap font-mono text-sm font-semibold" [class.text-primary]="selected()?.ident === airport.ident">{{ airport.ident }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm">{{ airport.name }}</span>
                  <span class="block truncate text-xs text-muted">
                    {{ airport.municipality ?? '—' }} · {{ airport.countryCode }}@if (airport.iataCode) { · <span class="font-mono">{{ airport.iataCode }}</span>}
                  </span>
                </span>
                <span class="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">{{ airport.type }}</span>
              </button>
            </li>
          } @empty {
            @if (!loading()) {
              <li class="px-4 py-10 text-center text-sm text-muted" data-testid="empty">No airports found.</li>
            }
          }
        </ul>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
            <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page <= 1 || loading()" (click)="goToPage(query().page - 1)">← Previous</button>
            <span class="text-muted" data-testid="page">Page {{ query().page }} of {{ totalPages() | number }}</span>
            <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page >= totalPages() || loading()" (click)="goToPage(query().page + 1)" data-testid="next">Next →</button>
          </div>
        }
      </section>

      <section class="space-y-4">
        <sb-airport-map class="h-[28rem] overflow-hidden rounded-xl border border-line" [airports]="result()?.items ?? []" [selected]="selected()" (airportClick)="select($event)" />

        @if (selected(); as airport) {
          <div class="sb-card p-6" data-testid="airport-details">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="font-mono text-sm text-primary">{{ airport.ident }}@if (airport.iataCode) { · {{ airport.iataCode }}}</p>
                <h2 class="mt-1 text-xl font-semibold">{{ airport.name }}</h2>
                <p class="text-sm text-muted">{{ airport.municipality ?? '—' }}, {{ airport.regionCode }}</p>
              </div>
              <span class="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">{{ airport.type }}</span>
            </div>
            <dl class="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt class="text-xs text-muted">Elevation</dt>
                <dd class="font-mono">{{ airport.elevationFt === null ? '—' : (airport.elevationFt | number) + ' ft' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted">Latitude</dt>
                <dd class="font-mono">{{ airport.latitude | number: '1.4-4' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted">Longitude</dt>
                <dd class="font-mono">{{ airport.longitude | number: '1.4-4' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted">Scheduled service</dt>
                <dd>{{ airport.scheduledService ? 'Yes' : 'No' }}</dd>
              </div>
            </dl>
          </div>
        } @else {
          <p class="text-sm text-muted">Select an airport on the list or on the map to see its details.</p>
        }
      </section>
    </div>
  `
})
export class AirportsPage {
  private readonly airports = inject(AirportsService);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly countryControl = new FormControl('', { nonNullable: true });

  protected readonly query = signal<AirportQuery>({ search: '', country: '', page: 1 });
  protected readonly result = signal<PagedResult<Airport> | null>(null);
  protected readonly selected = signal<Airport | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalPages = computed(() => Math.ceil((this.result()?.totalCount ?? 0) / AIRPORTS_PAGE_SIZE));

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), map(value => value.trim()), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(search => this.query.update(q => ({ ...q, search, page: 1 })));

    this.countryControl.valueChanges
      .pipe(debounceTime(300), map(value => value.trim().toUpperCase()), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(country => this.query.update(q => ({ ...q, country, page: 1 })));

    toObservable(this.query)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(query =>
          this.airports.search(query).pipe(
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

  protected select(airport: Airport): void {
    this.selected.set(airport);
  }

  protected goToPage(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }
}