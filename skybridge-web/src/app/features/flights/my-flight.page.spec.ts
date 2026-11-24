import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Booking } from '../../core/bookings/booking.models';
import {
  acceptedMedevac,
  bookedGolFlight,
  executiveTour,
  filedPirep,
  linkedPilot,
  medevacOfp,
  pilotAtFlorianopolis
} from '../../testing/freelance';
import { MyFlightPage } from './my-flight.page';

describe('MyFlightPage', () => {
  let fixture: ComponentFixture<MyFlightPage>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  const ready: Booking = { ...acceptedMedevac, flightPlan: medevacOfp };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MyFlightPage);
  });

  afterEach(() => http.verify());

  async function load(booking: Booking | null, pilot = linkedPilot) {
    await fixture.whenStable();
    http.expectOne('/api/pilot').flush(pilot);
    http.expectOne('/api/bookings/current').flush(booking);
    await fixture.whenStable();
  }

  it('links to the freelance board without an active flight', async () => {
    await load(null);

    expect(query('no-flight')!.textContent).toContain('You have no active flight.');
    expect(query('no-flight')!.querySelector('a')!.getAttribute('href')).toBe('/freelance');
  });

  it('shows the legs, the current one and the briefing', async () => {
    await load({ ...acceptedMedevac, currentLeg: 2, legCount: 3, startedAtUtc: '2026-11-23T13:00:00Z', job: executiveTour });

    expect(query('flight')!.textContent).toContain('SBFL → SBGR → SBRJ → SBFL');
    expect(query('flight-status')!.textContent).toContain('Ready for leg 2 of 3');
    expect(query('leg-1')!.textContent).toContain('Done');
    expect(query('leg-2')!.textContent).toContain('Next');
    expect(query('leg-2')!.classList).toContain('border-primary');
    expect(query('start-leg')!.textContent).toContain('Start leg 2');
    expect(fixture.nativeElement.querySelector('[data-testid="briefing"]')).not.toBeNull();
  });

  it('needs the SimBrief OFP before the leg can start', async () => {
    await load(acceptedMedevac);

    expect((query('start-leg') as HTMLButtonElement).disabled).toBe(true);
    expect(query('needs-ofp')!.textContent).toContain('Import the SimBrief OFP');
    expect(query('import-ofp')).not.toBeNull();
  });

  it('starts the leg once the OFP is imported', async () => {
    await load(acceptedMedevac);

    query('import-ofp')!.click();
    http.expectOne('/api/bookings/current/flight-plan').flush(ready);
    await fixture.whenStable();

    expect(query('flight-status')!.textContent).toContain('Not started');
    expect(query('needs-ofp')).toBeNull();
    query('start-leg')!.click();
    http.expectOne('/api/bookings/current/start').flush({
      ...ready, legInProgress: true, startedAtUtc: '2026-11-23T14:05:00Z', legStartedAtUtc: '2026-11-23T14:05:00Z'
    });
    await fixture.whenStable();

    expect(query('flight-status')!.textContent).toContain('Leg 1 of 1 in progress');
    expect(query('flight-status')!.textContent).toContain('14:05 UTC');
    expect(query('start-leg')).toBeNull();
    expect(query('pirep-hint')!.textContent).toContain('Land at SBGR');
    expect((query('pirep-fuel') as HTMLInputElement).value).toBe('350');
  });

  it('cancels the flight after confirming', async () => {
    await load(acceptedMedevac);

    query('cancel-flight')!.click();
    await fixture.whenStable();
    query('confirm-cancel')!.click();
    http.expectOne('/api/bookings/current/cancel').flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(query('flight')).toBeNull();
    expect(query('no-flight')).not.toBeNull();
  });

  it('shows the error when the leg cannot start', async () => {
    await load(ready);

    query('start-leg')!.click();
    http.expectOne('/api/bookings/current/start').flush(
      { errors: { Booking: ['The deadline to start this flight has passed.'] } },
      { status: 400, statusText: 'Bad Request' }
    );
    await fixture.whenStable();

    expect(query('flight-error')!.textContent).toContain('deadline');
  });

  const flying: Booking = { ...ready, legInProgress: true, startedAtUtc: '2026-11-23T14:05:00Z', legStartedAtUtc: '2026-11-23T14:05:00Z' };
  const gruPilot = { ...linkedPilot, location: { ...pilotAtFlorianopolis.location!, code: 'SBGR' }, flightHours: 1.5, flightMinutes: 90, balance: 4500 };

  async function fileLeg(response: object) {
    query('pirep-form')!.dispatchEvent(new Event('submit'));
    http.expectOne('/api/pireps').flush(response);
    await fixture.whenStable();
  }

  it('moves to the next leg after filing a PIREP', async () => {
    await load({ ...flying, legCount: 3, job: executiveTour });

    await fileLeg({
      pirep: { ...filedPirep, legCount: 3 },
      booking: { ...flying, legCount: 3, currentLeg: 2, legInProgress: false, legStartedAtUtc: null, job: executiveTour, flightPlan: null },
      rewardPaid: null,
      pilot: gruPilot
    });

    expect(query('flight-notice')!.textContent).toContain('Leg 1 filed. You are now at SBGR.');
    expect(query('start-leg')!.textContent).toContain('Start leg 2');
    expect(query('needs-ofp')).not.toBeNull();
    expect(query('pirep-form')).toBeNull();
  });

  it('celebrates the last leg and shows the reward', async () => {
    await load(flying);

    await fileLeg({ pirep: filedPirep, booking: null, rewardPaid: 4500, pilot: gruPilot });

    expect(query('flight')).toBeNull();
    expect(query('no-flight')).toBeNull();
    expect(query('mission-complete')!.textContent).toContain('+$4,500 added to your balance');
    expect(query('mission-complete')!.textContent).toContain('SBGR');
    expect(query('mission-complete')!.textContent).toContain('1h30min flown');
  });

  it('explains when the reward waits for staff review', async () => {
    await load(flying);

    await fileLeg({ pirep: { ...filedPirep, status: 'Pending', flag: 'Too short' }, booking: null, rewardPaid: null, pilot: gruPilot });

    expect(query('mission-complete')!.textContent).toContain('waiting for staff review');
  });

  it('shows an airline flight with its hourly pay and the airline route to plan', async () => {
    await load(bookedGolFlight);

    expect(query('flight-number')!.textContent).toContain('GLO1042');
    expect(query('flight')!.textContent).toContain('Gol Transportes Aéreos');
    expect(query('flight-pay')!.textContent).toContain('$320/h');
    expect(query('leg-1')!.textContent).toContain('SBFL → SBGR');
    expect(query('leg-1')!.textContent).not.toContain('pax');
    expect(query('scheduled-route')!.textContent).toContain('UZ6 PAKOT DCT');
    expect(query('scheduled-route')!.textContent).toContain('FL360');
  });

  it('names the flight when an airline flight is complete', async () => {
    await load({ ...bookedGolFlight, legInProgress: true, startedAtUtc: '2026-11-23T14:05:00Z', legStartedAtUtc: '2026-11-23T14:05:00Z' });

    await fileLeg({ pirep: filedPirep, booking: null, rewardPaid: 480, pilot: gruPilot });

    expect(query('mission-complete')!.textContent).toContain('FLIGHT GLO1042 COMPLETE');
    expect(query('mission-complete')!.textContent).toContain('+$480');
  });
});