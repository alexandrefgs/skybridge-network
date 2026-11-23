import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { acceptedMedevac, medevac, pilotAtFlorianopolis, executiveTour } from '../../testing/freelance';
import { page } from '../../testing/airlines';
import { FreelancePage } from './freelance.page';

describe('FreelancePage', () => {
  let fixture: ComponentFixture<FreelancePage>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FreelancePage);
  });

  async function start(pilot = pilotAtFlorianopolis, booking: typeof acceptedMedevac | null = null) {
    await fixture.whenStable();
    http.expectOne('/api/bookings/current').flush(booking);
    http.expectOne(r => r.url === '/api/freelance' && !r.params.has('from')).flush(page([]));
    http.expectOne('/api/pilot').flush(pilot);
    await fixture.whenStable();
  }

  it('asks a new pilot where to start and moves there', async () => {
    await start({ location: null, flightHours: 0, flightMinutes: 0, balance: 0 });

    expect(query('location')!.textContent).toContain('Choose where your career starts');
    const input = query('jumpseat-airport') as HTMLInputElement;
    input.value = 'sbfl';
    input.dispatchEvent(new Event('input'));
    query('jumpseat-form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/pilot/jumpseat');
    expect(request.request.body).toEqual({ airport: 'SBFL' });
    request.flush(pilotAtFlorianopolis);
    await fixture.whenStable();

    http.expectOne(r => r.url === '/api/freelance' && r.params.get('from') === 'SBFL').flush(page([medevac]));
    await fixture.whenStable();
    expect(query('location')!.textContent).toContain('Hercílio Luz International Airport');
    expect(query('job-7')).not.toBeNull();
  });

  it('lists jobs from the current airport and opens the briefing', async () => {
    await start();
    http.expectOne(r => r.url === '/api/freelance' && r.params.get('from') === 'SBFL').flush(page([medevac, executiveTour]));
    await fixture.whenStable();

    expect(query('job-7')!.textContent).toContain('MEDEVAC');
    expect(query('job-8')!.textContent).toContain('SBFL → SBGR → SBRJ → SBFL');
    expect(query('job-8')!.textContent).toContain('3 legs');
    expect(query('job-8')!.textContent).toContain('6 pax');
    expect(query('balance')!.textContent).toContain('$0');
    expect(query('flight-time')!.textContent).toContain('0min');
    expect(query('job-7')!.querySelector('[data-testid="dg-badge"]')).not.toBeNull();
    expect(query('job-8')!.querySelector('[data-testid="dg-badge"]')).toBeNull();

    (query('job-7')!.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(query('job-7')!.querySelector('[data-testid="briefing"]')!.textContent).toContain('Maria Souza');
  });

  it('shows jobs from everywhere when the filter is off', async () => {
    await start();
    http.expectOne(r => r.url === '/api/freelance' && r.params.get('from') === 'SBFL').flush(page([]));
    await fixture.whenStable();
    expect(query('no-jobs')!.textContent).toContain('No jobs leaving from here');

    const checkbox = query('only-here') as HTMLInputElement;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    http.expectOne(r => r.url === '/api/freelance' && !r.params.has('from')).flush(page([medevac]));
    await fixture.whenStable();
    expect(query('job-7')).not.toBeNull();
  });

  it('shows the error when the airport does not exist', async () => {
    await start();
    http.expectOne(r => r.url === '/api/freelance').flush(page([]));
    await fixture.whenStable();

    query('open-jumpseat')!.click();
    await fixture.whenStable();
    const input = query('jumpseat-airport') as HTMLInputElement;
    input.value = 'ZZZZ';
    input.dispatchEvent(new Event('input'));
    query('jumpseat-form')!.dispatchEvent(new Event('submit'));
    http.expectOne('/api/pilot/jumpseat').flush(
      { errors: { Airport: ["Airport 'ZZZZ' was not found."] } },
      { status: 400, statusText: 'Bad Request' }
    );
    await fixture.whenStable();

    expect(query('location-error')!.textContent).toContain("Airport 'ZZZZ' was not found.");
  });
  
  async function openMedevac() {
    http.expectOne(r => r.url === '/api/freelance' && r.params.get('from') === 'SBFL').flush(page([medevac]));
    await fixture.whenStable();
    (query('job-7')!.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
  }

  it('accepts a job with the chosen aircraft and opens my flight', async () => {
    await start();
    await openMedevac();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    const select = query('accept-aircraft') as HTMLSelectElement;
    select.value = 'PC12';
    select.dispatchEvent(new Event('change'));
    query('accept-form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/freelance/7/accept');
    expect(request.request.body).toEqual({ aircraft: 'PC12' });
    request.flush(acceptedMedevac);
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith('/flight');
  });

  it('shows why the aircraft cannot be used', async () => {
    await start();
    await openMedevac();

    query('accept-form')!.dispatchEvent(new Event('submit'));
    http.expectOne('/api/freelance/7/accept').flush(
      { errors: { Aircraft: ['C208 is a Turboprop aircraft and needs 25 h. You have 0.0 h.'] } },
      { status: 400, statusText: 'Bad Request' }
    );
    await fixture.whenStable();

    expect(query('accept-error')!.textContent).toContain('needs 25 h');
  });

  it('asks for a jumpseat when the job departs from elsewhere', async () => {
    await start();
    http.expectOne(r => r.url === '/api/freelance').flush(page([{ ...medevac, origin: 'SBGR' }]));
    await fixture.whenStable();
    (query('job-7')!.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(query('accept-form')).toBeNull();
    expect(query('accept')!.textContent).toContain('departs from SBGR');
  });

  it('shows the active flight and hides accept and jumpseat', async () => {
    await start(pilotAtFlorianopolis, acceptedMedevac);
    await openMedevac();

    expect(query('active-flight')!.textContent).toContain('SBFL → SBGR · C208');
    expect(query('open-jumpseat')).toBeNull();
    expect(query('accept-form')).toBeNull();
  });
});