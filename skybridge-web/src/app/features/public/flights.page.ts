import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { PublicFlight } from '../../core/public/public.models';
import { PublicService } from '../../core/public/public.service';
import { FlightCard } from '../../shared/public/flight-card';

@Component({
  selector: 'sb-flights-page',
  imports: [RouterLink, FlightCard],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="font-mono text-xs tracking-[0.2em] text-primary">UPDATED EVERY MINUTE</p>
        <h1 class="mt-2 font-display text-5xl font-bold">Last flights flown</h1>
      </div>
      <a routerLink="/operations" class="border-b border-foreground pb-1 text-sm font-medium hover:border-primary hover:text-primary">Our operation →</a>
    </div>

    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="public-flights">
      @for (flight of flights(); track flight.id) {
        <sb-flight-card [flight]="flight" />
      } @empty {
        <p class="text-muted sm:col-span-2 lg:col-span-4" data-testid="no-public-flights">The first flights are about to take off.</p>
      }
    </div>
  `
})
export class FlightsPage {
  protected readonly flights = signal<PublicFlight[]>([]);

  constructor() {
    const service = inject(PublicService);
    interval(60_000)
      .pipe(
        startWith(0),
        switchMap(() => service.flights(4).pipe(catchError(() => of(null)))),
        takeUntilDestroyed()
      )
      .subscribe(flights => {
        if (flights) this.flights.set(flights);
      });
  }
}