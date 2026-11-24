import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Booking } from '../../core/bookings/booking.models';
import { Pilot } from '../../core/pilot/pilot.models';
import { bookedGolFlight, golOfp, linkedPilot, pilotAtFlorianopolis } from '../../testing/freelance';
import { FlightPlanCard } from './flight-plan-card';

describe('FlightPlanCard', () => {
  let fixture: ComponentFixture<FlightPlanCard>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FlightPlanCard);
  });

  afterEach(() => http.verify());

  async function render(booking: Booking, pilot: Pilot) {
    fixture.componentRef.setInput('booking', booking);
    fixture.componentRef.setInput('pilot', pilot);
    await fixture.whenStable();
  }

  it('sends the pilot to Settings to add the SimBrief pilot ID', async () => {
    await render(bookedGolFlight, pilotAtFlorianopolis);

    expect(query('import-ofp')).toBeNull();
    expect(query('plan-simbrief')).toBeNull();
    expect(query('simbrief-settings-link')!.getAttribute('href')).toBe('/account/profile');
  });

  it('opens SimBrief prefilled and imports the OFP', async () => {
    let imported: Booking | null = null;
    fixture.componentInstance.imported.subscribe(booking => (imported = booking));
    await render(bookedGolFlight, linkedPilot);

    expect(query('simbrief-id')!.textContent).toContain('123456');
    expect(query('plan-simbrief')!.getAttribute('href')).toContain('orig=SBFL&dest=SBGR&type=B738&airline=GLO&fltnum=1042');
    query('import-ofp')!.click();
    http.expectOne('/api/bookings/current/flight-plan').flush({ ...bookedGolFlight, flightPlan: golOfp });

    expect(imported!.flightPlan).toEqual(golOfp);
  });

  it('lists every reason the OFP does not match', async () => {
    await render(bookedGolFlight, linkedPilot);

    query('import-ofp')!.click();
    http.expectOne('/api/bookings/current/flight-plan').flush(
      { errors: { FlightPlan: ['The OFP departs from SBGR, but this leg departs from SBFL.', 'The OFP is for a A320, but you booked a B738.'] } },
      { status: 400, statusText: 'Bad Request' }
    );
    await fixture.whenStable();

    expect(query('ofp-errors')!.querySelectorAll('li').length).toBe(2);
    expect(query('ofp-errors')!.textContent).toContain('for a A320');
  });

  it('shows the imported OFP and hides re-import during the leg', async () => {
    await render({ ...bookedGolFlight, flightPlan: golOfp }, linkedPilot);

    expect(query('ofp-details')!.textContent).toContain('GLO1042');
    expect(query('ofp-details')!.textContent).toContain('FL360');
    expect(query('ofp-details')!.textContent).toContain('8,000 kg');
    expect(query('ofp-route')!.textContent).toContain('PAKOT UZ6 BUXUK');
    expect(query('reimport-ofp')).not.toBeNull();

    fixture.componentRef.setInput('booking', { ...bookedGolFlight, flightPlan: golOfp, legInProgress: true });
    await fixture.whenStable();
    expect(query('reimport-ofp')).toBeNull();
  });
});