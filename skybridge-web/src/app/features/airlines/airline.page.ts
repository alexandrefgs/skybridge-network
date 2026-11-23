import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AirlineDetail } from '../../core/airlines/airline.models';
import { AirlinesService } from '../../core/airlines/airlines.service';
import { problemMessages } from '../../core/http/problem';
import { DataCredits } from '../../shared/data/data-credits';
import { RouteList } from '../../shared/routes/route-list';

@Component({
  selector: 'sb-airline-page',
  imports: [RouterLink, DatePipe, DecimalPipe, RouteList, DataCredits],
  template: `
    <a routerLink="/airlines" class="text-sm text-muted transition-colors hover:text-primary">← Airlines</a>

    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    @if (airline(); as a) {
      <div class="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="font-mono text-xs tracking-[0.2em] text-primary" data-testid="codes">{{ a.icaoCode ?? '—' }} · {{ a.iataCode ?? '—' }}</p>
          <h1 class="mt-1 font-display text-3xl font-bold" data-testid="airline-name">{{ a.name }}</h1>
          <p class="mt-1 text-muted">
            {{ a.country ?? 'Unknown country' }}
            @if (a.callsign) {
              · callsign <span class="font-mono">{{ a.callsign }}</span>
            }
            @if (!a.isActive) {
              · <span class="text-primary">inactive</span>
            }
          </p>
        </div>
        <div class="text-right text-sm text-muted">
          <p><span class="font-mono text-2xl font-semibold text-foreground">{{ a.routeCount | number }}</span> routes</p>
          @if (a.routesUpdatedAtUtc) {
            <p class="mt-1" data-testid="routes-updated">
              Updated {{ a.routesUpdatedAtUtc | date: 'd MMM y' }} from {{ a.routesSource }}
              @if (a.routesEdition) {
                · edition {{ a.routesEdition | date: 'd MMM y' }}
              }
            </p>
          }
        </div>
      </div>

      <section class="mt-8" aria-label="Fleet">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">Fleet</h2>
        <div class="mt-3 flex flex-wrap gap-2" data-testid="fleet">
          @for (type of a.fleet; track type.icaoCode) {
            <span class="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
              <span class="font-mono font-semibold">{{ type.icaoCode }}</span>
              <span class="ml-2 text-muted">{{ type.manufacturer }} {{ type.model }}</span>
            </span>
          } @empty {
            <p class="text-sm text-muted">No fleet defined yet.</p>
          }
        </div>
      </section>

      <section class="mt-10">
        <sb-route-list [airlineId]="a.id" />
      </section>

      <sb-data-credits />
    }
  `
})
export class AirlinePage {
  private readonly airlines = inject(AirlinesService);

  readonly id = input.required<string>();

  protected readonly airline = signal<AirlineDetail | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap(id =>
          this.airlines.get(Number(id)).pipe(
            catchError(error => {
              this.error.set(error?.status === 404 ? 'Airline not found.' : problemMessages(error)[0]);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(airline => this.airline.set(airline));
  }
}