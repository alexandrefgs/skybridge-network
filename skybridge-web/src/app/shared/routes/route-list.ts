import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { AirlineRoute, RouteFilter, RouteQuery } from '../../core/airlines/airline.models';
import { AirlinesService, ROUTES_PAGE_SIZE } from '../../core/airlines/airlines.service';
import { PagedResult } from '../../core/http/paged-result';
import { problemMessages } from '../../core/http/problem';

@Component({
  selector: 'sb-route-list',
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        Routes
        <span class="ml-1 text-sm font-normal text-muted" data-testid="route-count">· {{ totalCount() | number }}</span>
      </h2>
      <div class="flex items-center gap-3">
        @if (filter(); as f) {
          <span class="flex items-center gap-2 rounded-md border border-primary px-3 py-1.5 font-mono text-xs text-primary" data-testid="route-filter">
            {{ f.to ? f.from + ' ⇄ ' + f.to : 'From ' + f.from }}
            <button type="button" class="text-primary hover:text-foreground" (click)="filterChange.emit(null)" aria-label="Show all routes" data-testid="clear-filter">×</button>
          </span>
        }
        <input class="sb-input w-72" type="search" placeholder="Search airport ICAO, IATA or city" [formControl]="searchControl" data-testid="route-search">
      </div>
    </div>

    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    <div class="sb-card mt-4 overflow-x-auto p-0">
      <table class="w-full text-sm" data-testid="routes">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">From</th>
            <th class="px-4 py-3 font-medium">To</th>
            <th class="px-4 py-3 text-right font-medium">Distance</th>
            <th class="px-4 py-3 font-medium">Aircraft</th>
            <th class="px-4 py-3 text-right font-medium">FL</th>
            <th class="px-4 py-3 font-medium">Route</th>
            @if (editable()) {
              <th class="px-4 py-3"></th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (route of result()?.items ?? []; track route.id) {
            <tr class="transition-colors hover:bg-surface-2"
              [class.cursor-pointer]="!editable()"
              [class.bg-surface-2]="isSelected(route)"
              (click)="!editable() && filterChange.emit({ from: route.origin, to: route.destination })"
              [attr.data-testid]="'route-row-' + route.id">
              <td class="whitespace-nowrap px-4 py-3" [title]="route.originName">
                <span class="font-mono font-semibold">{{ route.origin }}</span>
                @if (route.originIata) {
                  <span class="ml-1 font-mono text-xs text-muted">{{ route.originIata }}</span>
                }
              </td>
              <td class="whitespace-nowrap px-4 py-3" [title]="route.destinationName">
                <span class="font-mono font-semibold">{{ route.destination }}</span>
                @if (route.destinationIata) {
                  <span class="ml-1 font-mono text-xs text-muted">{{ route.destinationIata }}</span>
                }
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right font-mono">{{ route.distanceNm | number }} nm</td>
              <td class="px-4 py-3 font-mono text-xs">{{ route.aircraft.length ? route.aircraft.join(' ') : '—' }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ route.flightLevel ?? '—' }}</td>
              <td class="max-w-md truncate px-4 py-3 font-mono text-xs text-muted" [title]="route.atsRoute ?? ''">{{ route.atsRoute ?? '—' }}</td>
              @if (editable()) {
                <td class="whitespace-nowrap px-4 py-2 text-right">
                  @if (confirmingDelete() === route.id) {
                    <span class="mr-2 text-xs text-muted">Delete?</span>
                    <button type="button" class="sb-btn-danger px-3 py-1" (click)="delete.emit(route); confirmingDelete.set(null)" data-testid="confirm-delete-route">Delete</button>
                    <button type="button" class="ml-2 text-muted hover:text-foreground" (click)="confirmingDelete.set(null)">Cancel</button>
                  } @else {
                    <button type="button" class="text-muted transition-colors hover:text-primary" (click)="edit.emit(route)" [attr.data-testid]="'edit-route-' + route.id">Edit</button>
                    <button type="button" class="ml-4 text-muted transition-colors hover:text-primary" (click)="confirmingDelete.set(route.id)" [attr.data-testid]="'delete-route-' + route.id">Delete</button>
                  }
                </td>
              }
            </tr>
          } @empty {
            @if (!loading()) {
              <tr>
                <td [attr.colspan]="editable() ? 7 : 6" class="px-4 py-10 text-center text-muted" data-testid="no-routes">No routes found.</td>
              </tr>
            }
          }
        </tbody>
      </table>

      @if (totalPages() > 1) {
        <div class="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page <= 1 || loading()" (click)="goToPage(query().page - 1)" data-testid="routes-previous">← Previous</button>
          <span class="text-muted" data-testid="routes-page">Page {{ query().page }} of {{ totalPages() }}</span>
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page >= totalPages() || loading()" (click)="goToPage(query().page + 1)" data-testid="routes-next">Next →</button>
        </div>
      }
    </div>
  `
})
export class RouteList {
  private readonly airlines = inject(AirlinesService);

  readonly airlineId = input.required<number>();
  readonly editable = input(false);
  readonly refresh = input(0);
  readonly filter = input<RouteFilter | null>(null);
  readonly filterChange = output<RouteFilter | null>();
  readonly edit = output<AirlineRoute>();
  readonly delete = output<AirlineRoute>();

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly query = signal<RouteQuery>({ search: '', page: 1, pageSize: ROUTES_PAGE_SIZE });
  protected readonly result = signal<PagedResult<AirlineRoute> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmingDelete = signal<number | null>(null);
  protected readonly totalCount = computed(() => this.result()?.totalCount ?? 0);
  protected readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.query().pageSize));

  private lastFilter: RouteFilter | null = null;
  private readonly load$ = new Subject<{ id: number; query: RouteQuery; filter: RouteFilter | null }>();

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), map(value => value.trim()), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(search => this.query.update(q => ({ ...q, search, page: 1 })));

    this.load$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ id, query, filter }) =>
          this.airlines.routes(id, query, filter).pipe(
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

    effect(() => {
      const id = this.airlineId();
      const query = this.query();
      const filter = this.filter();
      this.refresh();
      if (filter !== this.lastFilter) {
        this.lastFilter = filter;
        if (query.page !== 1) {
          untracked(() => this.query.set({ ...query, page: 1 }));
          return;
        }
      }
      untracked(() => this.load$.next({ id, query, filter }));
    });
  }

  protected isSelected(route: AirlineRoute): boolean {
    const filter = this.filter();
    return !!filter?.to && [filter.from, filter.to].includes(route.origin) && [filter.from, filter.to].includes(route.destination);
  }

  protected goToPage(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }
}