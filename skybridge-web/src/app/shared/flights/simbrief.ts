import { Booking } from '../../core/bookings/booking.models';
import { currentLeg } from './booking-legs';

const DISPATCH_URL = 'https://dispatch.simbrief.com/options/custom';

export function simBriefDispatchUrl(booking: Booking): string {
  const leg = currentLeg(booking);
  const params = new URLSearchParams();
  if (leg) {
    params.set('orig', leg.origin);
    params.set('dest', leg.destination);
  }
  params.set('type', booking.aircraft);

  const match = booking.flightNumber?.match(/^([A-Z0-9]*?[A-Z][A-Z0-9]*?)(\d+)$/);
  if (match) {
    params.set('airline', match[1]);
    params.set('fltnum', match[2]);
  }
  if (booking.flight?.atsRoute) params.set('route', booking.flight.atsRoute);
  if (leg?.passengerCount) params.set('pax', String(leg.passengerCount));

  return `${DISPATCH_URL}?${params.toString()}`;
}