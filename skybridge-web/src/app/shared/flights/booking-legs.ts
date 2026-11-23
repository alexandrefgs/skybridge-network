import { Booking } from '../../core/bookings/booking.models';
import { routeOf } from '../freelance/missions';

export interface BookingLeg {
  sequence: number;
  origin: string;
  destination: string;
  distanceNm: number;
  passengerCount: number | null;
  cargoKg: number | null;
}

export function bookingLegs(booking: Booking): BookingLeg[] {
  if (booking.job) return booking.job.legs;
  if (!booking.flight) return [];

  const { origin, destination, distanceNm } = booking.flight;
  return [{ sequence: 1, origin, destination, distanceNm, passengerCount: null, cargoKg: null }];
}

export function bookingRoute(booking: Booking): string {
  if (booking.job) return routeOf(booking.job);
  return booking.flight ? `${booking.flight.origin} → ${booking.flight.destination}` : '—';
}

export function currentLeg(booking: Booking): BookingLeg | undefined {
  return bookingLegs(booking).find(leg => leg.sequence === booking.currentLeg);
}