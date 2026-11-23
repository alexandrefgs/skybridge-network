import { acceptedMedevac, bookedGolFlight, executiveTour } from '../../testing/freelance';
import { bookingLegs, bookingRoute, currentLeg } from './booking-legs';

describe('booking legs', () => {
  it('uses the legs of a freelance job', () => {
    const booking = { ...acceptedMedevac, job: executiveTour, legCount: 3, currentLeg: 2 };

    expect(bookingLegs(booking).length).toBe(3);
    expect(bookingRoute(booking)).toBe('SBFL → SBGR → SBRJ → SBFL');
    expect(currentLeg(booking)?.origin).toBe('SBGR');
  });

  it('turns an airline flight into a single leg', () => {
    expect(bookingLegs(bookedGolFlight)).toEqual([
      { sequence: 1, origin: 'SBFL', destination: 'SBGR', distanceNm: 278, passengerCount: null, cargoKg: null }
    ]);
    expect(bookingRoute(bookedGolFlight)).toBe('SBFL → SBGR');
  });
});