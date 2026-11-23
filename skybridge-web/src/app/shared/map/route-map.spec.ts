import { nearestLongitude } from './route-map';

describe('nearestLongitude', () => {
  it('crosses the Pacific instead of going around the world', () => {
    expect(nearestLongitude(-157.92, 140.39)).toBeCloseTo(-219.61);
    expect(nearestLongitude(140.39, -157.92)).toBeCloseTo(202.08);
  });

  it('keeps longitudes that are already close', () => {
    expect(nearestLongitude(-46.47, -0.46)).toBe(-0.46);
  });
});