import { LiveFlight } from '../../core/public/public.models';
import { altitudeLabel, distanceNm, flightKey, missionTag, phaseLabel, progress, remainingNm, routeDistanceNm } from './live-flight';
import { liveGol, liveMedevac } from '../../testing/live';

describe('live flight helpers', () => {
  it('measures great-circle distances in nautical miles', () => {
    expect(Math.round(distanceNm({ latitude: -23.432, longitude: -46.469 }, { latitude: -29.994, longitude: -51.171 }))).toBe(468);
    expect(routeDistanceNm(liveGol)).toBe(468);
  });

  it('works out how much of the route is done', () => {
    expect(progress(liveGol)!).toBeCloseTo(0.58, 1);
    expect(remainingNm(liveGol)).toBeGreaterThan(150);
    expect(progress({ ...liveGol, origin: null })).toBeNull();
  });

  it('writes altitudes as flight levels above the transition', () => {
    expect(altitudeLabel(35012)).toBe('FL350');
    expect(altitudeLabel(9487)).toBe('9,490 ft');
    expect(altitudeLabel(-20)).toBe('0 ft');
  });

  it('guesses the phase from speed and progress', () => {
    expect(phaseLabel({ ...liveGol, groundSpeedKt: 12 })).toBe('On the ground');
    expect(phaseLabel(liveGol)).toBe('En route');
    expect(phaseLabel({ ...liveGol, latitude: -23.5, longitude: -46.5 })).toBe('Departure');
    expect(phaseLabel({ ...liveGol, destination: null })).toBe('Airborne');
  });

  it('labels the mission of each flight', () => {
    expect(missionTag(liveGol)).toBe('AIRLINE · GOL');
    expect(missionTag(liveMedevac)).toBe('MEDEVAC');
    expect(missionTag({ ...liveGol, mission: null } as LiveFlight)).toBeNull();
    expect(flightKey(liveMedevac)).toBe('IVAO-654321');
  });
});