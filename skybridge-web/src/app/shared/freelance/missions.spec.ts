import { executiveTour, medevac } from '../../testing/freelance';
import { expiresIn, hasDangerousGoods, hazardLabel, maxCargo, maxPassengers, missionLabel, routeOf } from './missions';

describe('missions', () => {
  const now = Date.parse('2026-11-23T12:00:00Z');

  it('labels missions and hazard classes', () => {
    expect(missionLabel('Medevac')).toBe('MEDEVAC');
    expect(missionLabel('OrganTransport')).toBe('Organ transport');
    expect(hazardLabel('FlammableLiquids')).toBe('Class 3 · Flammable liquids');
  });

  it('formats the time left', () => {
    expect(expiresIn('2026-11-26T16:30:00Z', now)).toBe('3d 4h');
    expect(expiresIn('2026-11-23T14:05:00Z', now)).toBe('2h 5m');
    expect(expiresIn('2026-11-23T11:00:00Z', now)).toBe('Expired');
  });

  it('summarises the legs of a mission', () => {
    expect(routeOf(executiveTour)).toBe('SBFL → SBGR → SBRJ → SBFL');
    expect(maxPassengers(executiveTour)).toBe(6);
    expect(maxCargo(executiveTour)).toBe(120);
    expect(hasDangerousGoods(executiveTour)).toBe(false);
    expect(hasDangerousGoods(medevac)).toBe(true);
  });
});