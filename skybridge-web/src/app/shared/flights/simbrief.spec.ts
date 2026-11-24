import { acceptedMedevac, bookedGolFlight, executiveTour } from '../../testing/freelance';
import { simBriefDispatchUrl } from './simbrief';

describe('simBriefDispatchUrl', () => {
  const params = (url: string) => new URL(url).searchParams;

  it('prefills an airline flight with its number and route', () => {
    const url = simBriefDispatchUrl(bookedGolFlight);
    const query = params(url);

    expect(url.startsWith('https://dispatch.simbrief.com/options/custom?')).toBe(true);
    expect([query.get('orig'), query.get('dest'), query.get('type')]).toEqual(['SBFL', 'SBGR', 'B738']);
    expect([query.get('airline'), query.get('fltnum'), query.get('route')]).toEqual(['GLO', '1042', 'UZ6 PAKOT DCT']);
  });

  it('prefills the current leg of a freelance job with its passengers', () => {
    const query = params(simBriefDispatchUrl({ ...acceptedMedevac, job: executiveTour, legCount: 3, currentLeg: 2 }));

    expect([query.get('orig'), query.get('dest'), query.get('type')]).toEqual(['SBGR', 'SBRJ', 'C208']);
    expect(query.has('airline')).toBe(false);
    expect(query.get('pax')).toBe(String(executiveTour.legs[1].passengerCount));
  });
});