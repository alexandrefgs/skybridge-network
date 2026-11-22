import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { AircraftCategory, AircraftCategoryCode, AircraftType } from '../../core/aircraft/aircraft.models';
import { AircraftService } from '../../core/aircraft/aircraft.service';
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
              [class.border-primary]="selectedCategory() === category.code"
              [class.bg-surface-2]="selectedCategory() === category.code"
              [class.border-line]="selectedCategory() !== category.code"
              [class.bg-surface]="selectedCategory() !== category.code">
              <span class="font-mono text-lg font-semibold" [class.text-primary]="selectedCategory() === category.code">{{ category.requiredHours }} h</span>
              <span class="mt-1 text-xs leading-snug text-muted">{{ category.name }}</span>
            </button>
          </li>
        }
      </ol>
    </section>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        {{ selectedCategoryName() ?? 'All aircraft' }}
        <span class="ml-1 text-sm font-normal text-muted" data-testid="count">· {{ types().length }} {{ types().length === 1 ? 'type' : 'types' }}</span>
      </h2>
      <div class="flex items-center gap-3">
        @if (selectedCategory()) {
          <button type="button" class="text-sm text-muted transition-colors hover:text-primary" (click)="selectedCategory.set(null)">Show all</button>
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
            <th class="px-4 py-3 text-right font-medium">Seats</th>
            <th class="px-4 py-3 text-right font-medium">Cargo</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (type of types(); track type.icaoCode) {
            <tr class="transition-colors hover:bg-surface-2">
              <td class="px-4 py-3 font-mono font-semibold">{{ type.icaoCode }}</td>
              <td class="px-4 py-3">
                <span class="text-muted">{{ type.manufacturer }}</span> {{ type.model }}
              </td>
              <td class="px-4 py-3 text-muted">{{ categoryName(type.category) }}</td>
              <td class="px-4 py-3 text-muted">{{ type.engineCount }} × {{ type.engineType }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.rangeNm | number }} nm</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.cruiseSpeedKts }} kt</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.seats }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.maxCargoKg | number }} kg</td>
            </tr>
          } @empty {
            @if (!loading()) {
              <tr>
                <td colspan="8" class="px-4 py-10 text-center text-muted" data-testid="empty">No aircraft found.</td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `
})
export class AircraftPage {
  private readonly aircraft = inject(AircraftService);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly categories = signal<AircraftCategory[]>([]);
  protected readonly types = signal<AircraftType[]>([]);
  protected readonly selectedCategory = signal<AircraftCategoryCode | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly selectedCategoryName = computed(() => {
    const code = this.selectedCategory();
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

    const search$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map(value => value.trim()),
      distinctUntilChanged()
    );

    combineLatest([toObservable(this.selectedCategory), search$])
      .pipe(
        switchMap(([category, search]) => {
          this.loading.set(true);
          this.error.set(null);
          return this.aircraft.types(category, search).pipe(
            catchError(error => {
              this.error.set(problemMessages(error)[0]);
              return of([] as AircraftType[]);
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(types => {
        this.loading.set(false);
        this.types.set(types);
      });
  }

  protected toggleCategory(code: AircraftCategoryCode): void {
    this.selectedCategory.update(current => (current === code ? null : code));
  }

  protected categoryName(code: AircraftCategoryCode): string {
    return this.categories().find(c => c.code === code)?.name ?? code;
  }
}