import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Booking } from '../../core/bookings/booking.models';
import { Pilot } from '../../core/pilot/pilot.models';
import { emptyLogbook, monthLogbook, transactions } from '../../testing/dashboard';
import { acceptedMedevac, bookedGolFlight, golOfp, pilotAtFlorianopolis } from '../../testing/freelance';
import { Cockpit } from './cockpit';

describe('Cockpit', () => {
  let fixture: ComponentFixture<Cockpit>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  const veteran: Pilot = { ...pilotAtFlorianopolis, flightMinutes: 185, flightHours: 3.1, balance: 4500, vatsimId: 1234567 };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Cockpit);
    fixture.componentRef.setInput('firstName', 'Alexandre');
  });

  afterEach(() => http.verify());

  async function load(pilot: Pilot, booking: Booking | null, logbook = monthLogbook, items = transactions) {
    await fixture.whenStable();
    http.expectOne('/api/pilot').flush(pilot);
    http.expectOne(r => r.url === '/api/pilot/transactions').flush({ items, page: 1, pageSize: 5, totalCount: items.length });
    http.expectOne('/api/bookings/current').flush(booking);
    const request = http.expectOne(r => r.url === '/api/pireps/logbook');
    expect([request.request.params.get('period'), request.request.params.get('pageSize')]).toEqual(['all', '5']);
    request.flush(logbook);
    await fixture.whenStable();
  }

  it('greets the pilot with hours, balance and the latest activity', async () => {
    await load(veteran, null);

    expect(fixture.nativeElement.textContent).toContain('Welcome, Alexandre.');
    expect(query('location')!.textContent).toContain('SBFL');
    expect(query('stat-hours')!.textContent).toContain('3h05min');
    expect(query('stat-balance')!.textContent).toContain('$4,500');
    expect(query('stat-flights')!.textContent).toContain('556 nm');
    expect(query('active-flight')!.textContent).toContain('No active flight.');
    expect(query('recent-transactions')!.textContent).toContain('+$4,500');
    expect(query('recent-flights')!.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('shows the active flight and what it needs next', async () => {
    await load(veteran, acceptedMedevac);

    expect(query('active-status')!.textContent).toContain('Import the SimBrief OFP for leg 1');
    expect(query('open-flight')!.getAttribute('href')).toBe('/flight');
  });

  it('shows a leg in progress', async () => {
    await load(veteran, { ...bookedGolFlight, flightPlan: golOfp, legInProgress: true });

    expect(query('active-flight')!.textContent).toContain('GLO1042');
    expect(query('active-status')!.textContent).toContain('Leg 1 of 1 in progress');
  });

  it('guides a new pilot', async () => {
    await load({ ...pilotAtFlorianopolis, location: null }, null, emptyLogbook, []);

    expect(query('location')!.textContent).toContain('Pick your first airport');
    expect(query('recent-flights')!.textContent).toContain('Your flights will show up here.');
    expect(query('recent-transactions')!.textContent).toContain('No payments yet.');
  });
  
  it('asks a pilot without network ids for the VATSIM CID or IVAO VID', async () => {
    await load({ ...veteran, vatsimId: null }, null);
    expect(query('network-prompt')).not.toBeNull();

    const input = query('prompt-ivao') as HTMLInputElement;
    input.value = '654321';
    input.dispatchEvent(new Event('input'));
    (query('network-prompt')!.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/pilot/networks');
    expect(request.request.body).toEqual({ vatsimId: null, ivaoId: 654321 });
    request.flush({ ...veteran, vatsimId: null, ivaoId: 654321 });
    await fixture.whenStable();

    expect(query('network-prompt')).toBeNull();
  });

  it('lets the pilot answer later and does not ask again', async () => {
    await load({ ...veteran, vatsimId: null }, null);

    query('prompt-later')!.click();
    await fixture.whenStable();

    expect(query('network-prompt')).toBeNull();
    expect(localStorage.getItem('sb-network-prompt')).toBe('later');
  });

  it('does not ask a pilot who already linked a network', async () => {
    await load(veteran, null);

    expect(query('network-prompt')).toBeNull();
  });
});