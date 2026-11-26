import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { flnGru } from '../../testing/airlines';
import { bookedGolFlight } from '../../testing/freelance';
import { RouteBooking } from './route-booking';

describe('RouteBooking', () => {
  let fixture: ComponentFixture<RouteBooking>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RouteBooking);
    fixture.componentRef.setInput('route', flnGru);
    fixture.componentRef.setInput('airlineCode', 'GLO');
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('shows the flight number, the route and its aircraft', () => {
    expect(query('route-booking')!.textContent).toContain('GLO1010');
    expect(query('route-booking')!.textContent).toContain('SBFL → SBGR');
    expect((query('route-aircraft') as HTMLSelectElement).value).toBe('B738');
  });

  it('offers the same family from the airline fleet', () => {
    const options = [...(query('route-aircraft') as HTMLSelectElement).options].map(option => option.value);

    expect(options).toEqual(['B738', 'B38M', 'B739']);
    expect(query('family-hint')!.textContent).toContain('B739');
  });

  it('books the route with the chosen aircraft and opens my flight', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const select = query('route-aircraft') as HTMLSelectElement;
    select.value = 'B38M';
    select.dispatchEvent(new Event('change'));

    query('route-booking-form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/bookings/routes/10');
    expect(request.request.body).toEqual({ aircraft: 'B38M' });
    request.flush(bookedGolFlight);
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith('/flight');
  });

  it('shows why the flight cannot be booked', async () => {
    query('route-booking-form')!.dispatchEvent(new Event('submit'));
    http.expectOne('/api/bookings/routes/10').flush(
      { errors: { Aircraft: ['B738 is a Medium (narrow-body) aircraft and needs 300 h. You have 1.5 h.'] } },
      { status: 400, statusText: 'Bad Request' }
    );
    await fixture.whenStable();

    expect(query('booking-error')!.textContent).toContain('needs 300 h');
  });
});