import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { acceptedMedevac, executiveTour } from '../../testing/freelance';
import { MyFlightPage } from './my-flight.page';

describe('MyFlightPage', () => {
  let fixture: ComponentFixture<MyFlightPage>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MyFlightPage);
  });

  afterEach(() => http.verify());

  async function load(booking: typeof acceptedMedevac | null) {
    await fixture.whenStable();
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

  it('starts the leg', async () => {
    await load(acceptedMedevac);
    expect(query('flight-status')!.textContent).toContain('Not started');

    query('start-leg')!.click();
    http.expectOne('/api/bookings/current/start').flush({
      ...acceptedMedevac, legInProgress: true, startedAtUtc: '2026-11-23T14:05:00Z', legStartedAtUtc: '2026-11-23T14:05:00Z'
    });
    await fixture.whenStable();

    expect(query('flight-status')!.textContent).toContain('Leg 1 of 1 in progress');
    expect(query('flight-status')!.textContent).toContain('14:05 UTC');
    expect(query('start-leg')).toBeNull();
    expect(query('pirep-hint')!.textContent).toContain('Land at SBGR');
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
    await load(acceptedMedevac);

    query('start-leg')!.click();
    http.expectOne('/api/bookings/current/start').flush(
      { errors: { Booking: ['The deadline to start this flight has passed.'] } },
      { status: 400, statusText: 'Bad Request' }
    );
    await fixture.whenStable();

    expect(query('flight-error')!.textContent).toContain('deadline');
  });
});