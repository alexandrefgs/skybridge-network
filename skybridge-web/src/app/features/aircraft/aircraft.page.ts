import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { AircraftCategory, AircraftCategoryCode, AircraftType, AircraftTypeQuery } from '../../core/aircraft/aircraft.models';
import { AIRCRAFT_PAGE_SIZES, AircraftService, DEFAULT_AIRCRAFT_PAGE_SIZE } from '../../core/aircraft/aircraft.service';
import { PagedResult } from '../../core/http/paged-result';
import { problemMessages } from '../../core/http/problem';

@Component({
  selector: 'sb-aircraft-page',
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <p class="font-mono text-xs tracking-[0.2em] text-primary">CATALOG</p>
    <h1 class="mt-1 font-display text-3xl font-bold">Aircraft</h1>
    <p class="mt-1 text-muted">Every category unlocks with flight hours. Pick a category to see what you can fly.</p>

    <section class="mt-8" aria-label="Category progression">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">Progression</h2>
      <ol class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9" data-testid="categories">
        @for (category of categories(); track category.code) {
          <li>
            <button type="button" (click)="toggleCategory(category.code)"
              class="flex h-full w-full flex-col rounded-xl border p-3 text-left transition-colors"
              [class.border-primary]="query().category === category.code"
              [class.bg-surface-2]="query().category === category.code"
              [class.border-line]="query().category !== category.code"
              [class.bg-surface]="query().category !== category.code">
              <span class="font-mono text-lg font-semibold" [class.text-primary]="query().category === category.code">{{ category.requiredHours }} h</span>
              <span class="mt-1 text-xs leading-snug text-muted">{{ category.name }}</span>
            </button>
          </li>
        }
      </ol>
    </section>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        {{ selectedCategoryName() ?? 'All aircraft' }}
        <span class="ml-1 text-sm font-normal text-muted" data-testid="count">· {{ totalCount() }} {{ totalCount() === 1 ? 'type' : 'types' }}</span>
      </h2>
      <div class="flex items-center gap-3">
        @if (query().category) {
          <button type="button" class="text-sm text-muted transition-colors hover:text-primary" (click)="setCategory(null)">Show all</button>
        }
        <input class="sb-input w-72" type="search" placeholder="Search ICAO, manufacturer or model" [formControl]="searchControl" data-testid="search">
      </div>
    </div>

    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    <div class="sb-card mt-4 overflow-x-auto p-0">
      <table class="w-full text-sm" data-testid="types">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">ICAO</th>
            <th class="px-4 py-3 font-medium">Aircraft</th>
            <th class="px-4 py-3 font-medium">Category</th>
            <th class="px-4 py-3 font-medium">Engines</th>
            <th class="px-4 py-3 text-right font-medium">Range</th>
            <th class="px-4 py-3 text-right font-medium">Cruise</th>
            <th class="px-4 py-3 text-right font-medium">Ceiling</th>
            <th class="px-4 py-3 text-right font-medium">Min runway</th>
            <th class="px-4 py-3 text-right font-medium">Seats</th>
            <th class="px-4 py-3 text-right font-medium">Cargo</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (type of result()?.items ?? []; track type.icaoCode) {
            <tr class="transition-colors hover:bg-surface-2">
              <td class="px-4 py-3 font-mono font-semibold">{{ type.icaoCode }}</td>
              <td class="px-4 py-3">
                <span class="text-muted">{{ type.manufacturer }}</span> {{ type.model }}
              </td>
              <td class="px-4 py-3 text-muted">{{ categoryName(type.category) }}</td>
              <td class="px-4 py-3 text-muted">{{ type.engineCount }} × {{ type.engineType }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.rangeNm | number }} nm</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.cruiseSpeedKts }} kt</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.serviceCeilingFt | number }} ft</td>
              <td class="whitespace-nowrap px-4 py-3 text-right font-mono" [attr.data-testid]="'runway-' + type.icaoCode">
                {{ type.minRunwayFt | number }} ft@if (!type.requiresPavedRunway) {<span class="ml-1 text-xs text-muted" title="Can use unpaved runways">· any</span>}
              </td>
              <td class="px-4 py-3 text-right font-mono">{{ type.seats }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.maxCargoKg | number }} kg</td>
            </tr>
          } @empty {
            @if (!loading()) {
              <tr>
                <td colspan="10" class="px-4 py-10 text-center text-muted" data-testid="empty">No aircraft found.</td>
              </tr>
            }
          }
        </tbody>
      </table>

      @if (totalCount() > 0) {
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
          <div class="flex items-center gap-4 text-muted">
            <label class="flex items-center gap-2">
              Per page
              <select class="rounded-md border border-line bg-surface-2 px-2 py-1 text-foreground outline-none focus:border-primary"
                [value]="query().pageSize" (change)="setPageSize($any($event.target).value)" data-testid="page-size">
                @for (size of pageSizes; track size) {
                  <option [value]="size">{{ size }}</option>
                }
              </select>
            </label>
            <span data-testid="range">Showing {{ firstItem() }}–{{ lastItem() }} of {{ totalCount() }}</span>
          </div>
          @if (totalPages() > 1) {
            <div class="flex items-center gap-4">
              <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page <= 1 || loading()" (click)="goToPage(query().page - 1)" data-testid="previous">← Previous</button>
              <span class="text-muted" data-testid="page">Page {{ query().page }} of {{ totalPages() }}</span>
              <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page >= totalPages() || loading()" (click)="goToPage(query().page + 1)" data-testid="next">Next →</button>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AircraftPage {
  private readonly aircraft = inject(AircraftService);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly categories = signal<AircraftCategory[]>([]);
  protected readonly pageSizes = AIRCRAFT_PAGE_SIZES;
  protected readonly query = signal<AircraftTypeQuery>({ category: null, search: '', page: 1, pageSize: DEFAULT_AIRCRAFT_PAGE_SIZE });
  protected readonly result = signal<PagedResult<AircraftType> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly totalCount = computed(() => this.result()?.totalCount ?? 0);
  protected readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.query().pageSize));
  protected readonly firstItem = computed(() => (this.query().page - 1) * this.query().pageSize + 1);
  protected readonly lastItem = computed(() => Math.min(this.query().page * this.query().pageSize, this.totalCount()));
  protected readonly selectedCategoryName = computed(() => {
    const code = this.query().category;
    return code ? this.categoryName(code) : null;
  });

  constructor() {
    this.aircraft
      .categories()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: categories => this.categories.set(categories),
        error: error => this.error.set(problemMessages(error)[0])
      });

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
          this.aircraft.types(query).pipe(
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

  protected toggleCategory(code: AircraftCategoryCode): void {
    this.setCategory(this.query().category === code ? null : code);
  }

  protected setCategory(category: AircraftCategoryCode | null): void {
    this.query.update(q => ({ ...q, category, page: 1 }));
  }

  protected setPageSize(value: string): void {
    this.query.update(q => ({ ...q, pageSize: Number(value), page: 1 }));
  }

  protected goToPage(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }

  protected categoryName(code: AircraftCategoryCode): string {
    return this.categories().find(c => c.code === code)?.name ?? code;
  }
}