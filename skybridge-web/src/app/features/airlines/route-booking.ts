import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AirlineRoute } from '../../core/airlines/airline.models';
import { BookingService } from '../../core/bookings/booking.service';
import { problemMessages } from '../../core/http/problem';
import { Booking } from '../../core/bookings/booking.models';

@Component({
  selector: 'sb-route-booking',
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <section class="sb-card border-primary/50" data-testid="route-booking">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="font-mono text-[10px] tracking-[0.2em] text-primary">BOOK FLIGHT · {{ flightNumber() }}</p>
          <p class="mt-2 font-mono text-xl font-semibold">{{ route().origin }} → {{ route().destination }}</p>
          <p class="text-sm text-muted">{{ route().destinationName }} · {{ route().distanceNm | number }} nm
            @if (route().flightLevel) { · FL{{ route().flightLevel }} }
          </p>
        </div>
        <button type="button" class="text-sm text-muted hover:text-foreground" (click)="closed.emit()" data-testid="close-booking">Close</button>
      </div>

      <form class="mt-5 flex flex-wrap items-center gap-3" (submit)="book($event)" data-testid="route-booking-form">
        <label class="text-sm text-muted" for="route-aircraft">Aircraft</label>
        <select id="route-aircraft" class="sb-input w-32 font-mono" [formControl]="aircraft" data-testid="route-aircraft">
          @for (code of route().aircraft; track code) {
            <option [value]="code">{{ code }}</option>
          }
        </select>
        <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="saving()" data-testid="confirm-booking">Book flight</button>
        <p class="w-full text-xs text-muted">You have 24 hours to start the flight. Pay is per flight hour, by aircraft category.</p>
      </form>

      @if (error(); as message) {
        <p class="sb-error mt-3" data-testid="booking-error">{{ message }}</p>
      }
    </section>
  `
})
export class RouteBooking {
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);

  readonly route = input.required<AirlineRoute>();
  readonly airlineCode = input<string | null>(null);
  readonly closed = output<void>();
  readonly booked = output<Booking>();

  protected readonly aircraft = new FormControl('', { nonNullable: true });
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly flightNumber = computed(() => `${this.airlineCode() ?? 'SKB'}${1000 + (this.route().id % 9000)}`);

  constructor() {
    effect(() => {
      this.aircraft.setValue(this.route().aircraft[0] ?? '');
      this.error.set(null);
    });
  }

  protected book(event: Event): void {
    event.preventDefault();
    if (!this.aircraft.value) return;

    this.saving.set(true);
    this.error.set(null);
    this.bookings.bookRoute(this.route().id, this.aircraft.value).subscribe({
      next: booking => {
        this.saving.set(false);
        this.booked.emit(booking);
        this.router.navigateByUrl('/flight');
      },
      error: error => {
        this.saving.set(false);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }
}