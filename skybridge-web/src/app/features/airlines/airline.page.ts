import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AirlineDetail, AirlineRoute, RouteFilter, RouteNetwork } from '../../core/airlines/airline.models';
import { AirlinesService } from '../../core/airlines/airlines.service';
import { Booking } from '../../core/bookings/booking.models';
import { BookingService } from '../../core/bookings/booking.service';
import { problemMessages } from '../../core/http/problem';
import { Pilot } from '../../core/pilot/pilot.models';
import { PilotService } from '../../core/pilot/pilot.service';
import { bookingRoute } from '../../shared/flights/booking-legs';
import { DataCredits } from '../../shared/data/data-credits';
import { RouteMap } from '../../shared/map/route-map';
import { RouteList } from '../../shared/routes/route-list';
import { RouteBooking } from './route-booking';

@Component({
  selector: 'sb-airline-page',
  imports: [RouterLink, DatePipe, DecimalPipe, RouteList, RouteMap, DataCredits, RouteBooking],
  template: `
    <a routerLink="/airlines" class="text-sm text-muted transition-colors hover:text-primary">← Airlines</a>

    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    @if (airline(); as a) {
      <div class="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="font-mono text-xs tracking-[0.2em] text-primary" data-testid="codes">{{ a.icaoCode ?? '—' }} · {{ a.iataCode ?? '—' }}</p>
          <h1 class="mt-1 flex items-center gap-3 font-display text-3xl font-bold" data-testid="airline-name">
            {{ a.name }}
            @if (!a.isActive) {
              <span class="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-amber-500" data-testid="retro">Retro</span>
            }
          </h1>
          <p class="mt-1 text-muted">
            {{ a.country ?? 'Unknown country' }}
            @if (a.callsign) {
              · callsign <span class="font-mono">{{ a.callsign }}</span>
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

      <section class="sb-card mt-8 overflow-hidden p-0" aria-label="Route map">
        <sb-route-map class="h-[440px]" [network]="network()" [filter]="routeFilter()" (filterChange)="routeFilter.set($event)" />
        <p class="border-t border-line px-4 py-2 text-xs text-muted" data-testid="network-summary">
          {{ network()?.airports?.length ?? 0 | number }} airports · click an airport to see its departures, then a line to pick a route
        </p>
      </section>

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

      <section class="mt-10" aria-label="Fly this airline">
        @if (booking(); as active) {
          <div class="sb-card flex flex-wrap items-center justify-between gap-4 py-5" data-testid="fly-active">
            <p class="text-sm"><span class="text-primary">Active flight</span> · <span class="font-mono">{{ activeRoute(active) }} · {{ active.aircraft }}</span></p>
            <a routerLink="/flight" class="sb-btn-primary w-auto px-5">Go to my flight</a>
          </div>
        } @else if (pilot()?.location; as location) {
          @if (selected(); as route) {
            <sb-route-booking [route]="route" [airlineCode]="a.icaoCode ?? a.iataCode" (closed)="selected.set(null)" />
          } @else {
            <div class="sb-card flex flex-wrap items-center justify-between gap-4 py-5" data-testid="fly-here">
              <p class="text-sm text-muted">
                You are at <span class="font-mono font-semibold text-foreground">{{ location.code }}</span>.
                @if (a.isActive) {
                  Book any route departing from here.
                } @else {
                  This airline no longer operates, so its routes can't be booked.
                }
              </p>
              @if (a.isActive) {
                <button type="button" class="sb-btn-secondary w-auto px-4 py-1.5" (click)="routeFilter.set({ from: location.code, to: null })"
                  data-testid="show-departures">Departures from {{ location.code }}</button>
              }
            </div>
          }
        }
      </section>

      <section class="mt-6">
        <sb-route-list [airlineId]="a.id" [filter]="routeFilter()" (filterChange)="routeFilter.set($event)"
          [bookableFrom]="bookableFrom()" (book)="selected.set($event)" />
      </section>

      <sb-data-credits />
    }
  `
})
export class AirlinePage {
  private readonly airlines = inject(AirlinesService);

  readonly id = input.required<string>();

  protected readonly airline = signal<AirlineDetail | null>(null);
  protected readonly network = signal<RouteNetwork | null>(null);
  protected readonly routeFilter = signal<RouteFilter | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly pilot = signal<Pilot | null>(null);
  protected readonly booking = signal<Booking | null>(null);
  protected readonly selected = signal<AirlineRoute | null>(null);
  protected readonly bookableFrom = computed(() =>
    this.airline()?.isActive && !this.booking() ? (this.pilot()?.location?.code ?? null) : null
  );
  protected readonly activeRoute = bookingRoute;

  constructor() {
    inject(PilotService).get().pipe(catchError(() => of(null)), takeUntilDestroyed()).subscribe(pilot => this.pilot.set(pilot));
    inject(BookingService).current().pipe(catchError(() => of(null)), takeUntilDestroyed()).subscribe(booking => this.booking.set(booking));
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

    toObservable(this.id)
      .pipe(
        switchMap(id => this.airlines.network(Number(id)).pipe(catchError(() => of(null)))),
        takeUntilDestroyed()
      )
      .subscribe(network => this.network.set(network));
  }
}