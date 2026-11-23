import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { page } from '../../testing/airlines';
import { executiveTour, medevac } from '../../testing/freelance';
import { AdminFreelancePage } from './admin-freelance.page';

describe('AdminFreelancePage', () => {
  let fixture: ComponentFixture<AdminFreelancePage>;
  let http: HttpTestingController;
  const element = () => fixture.nativeElement as HTMLElement;
  const query = <T extends HTMLElement>(selector: string) => element().querySelector(selector) as T;

  const type = (selector: string, value: string, root: ParentNode = element()) => {
    const input = root.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    input.value = value;
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input'));
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminFreelancePage);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/aircraft-types').flush(page([{ icaoCode: 'C208' }, { icaoCode: 'PC12' }]));
    http.expectOne(r => r.url === '/api/admin/freelance').flush(page([medevac, { ...executiveTour, expired: true }]));
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('lists jobs with the whole route, expired ones and warnings', () => {
    expect(query('[data-testid="job-row-7"]').textContent).toContain('MEDEVAC');
    expect(query('[data-testid="job-row-8"]').textContent).toContain('SBFL → SBGR → SBRJ → SBFL');
    expect(query('[data-testid="job-row-8"]').textContent).toContain('Expired');
    expect(query('[data-testid="job-warning-8"]').getAttribute('title')).toContain('B738 needs 4,300 ft');
  });

  it('creates a mission with two legs, names and dangerous goods', async () => {
    query<HTMLButtonElement>('[data-testid="new-job"]').click();
    await fixture.whenStable();

    type('#job-kind', 'Medevac');
    type('#job-client', 'Hospital Santa Catarina');
    type('#job-briefing', 'Urgent transfer.');
    type('#job-reward', '4500');
    type('#leg-origin-0', 'sbfl');
    type('#leg-destination-0', 'sbgr');
    type('#leg-passengers-0', '2');
    type('#leg-names-0', 'Maria Souza\n\n João Souza ');
    query<HTMLButtonElement>('[data-testid="add-good-0"]').click();
    await fixture.whenStable();
    const good = query('[data-testid="good-0-0"]');
    type('input', 'Medical oxygen', good);
    type('select', 'Gases', good);
    const un = good.querySelectorAll('input')[2] as HTMLInputElement;
    un.value = 'un1072';
    un.dispatchEvent(new Event('input'));

    query<HTMLButtonElement>('[data-testid="add-leg"]').click();
    await fixture.whenStable();
    expect(query<HTMLInputElement>('#leg-origin-1').value).toBe('sbgr');
    type('#leg-destination-1', 'sbfl');
    type('[data-testid="add-aircraft"]', 'C208');
    await fixture.whenStable();
    query<HTMLFormElement>('[data-testid="job-form"]').dispatchEvent(new Event('submit'));

    const request = http.expectOne(r => r.method === 'POST' && r.url === '/api/admin/freelance');
    expect(request.request.body).toMatchObject({
      kind: 'Medevac', client: 'Hospital Santa Catarina', briefing: 'Urgent transfer.', reward: 4500, aircraft: ['C208'],
      legs: [
        {
          origin: 'SBFL', destination: 'SBGR', passengerCount: 2, passengerNames: ['Maria Souza', 'João Souza'],
          dangerousGoods: [{ name: 'Medical oxygen', class: 'Gases', quantityKg: 0, unNumber: 'UN1072' }]
        },
        { origin: 'SBGR', destination: 'SBFL', passengerCount: 0, passengerNames: [], dangerousGoods: [] }
      ]
    });
    expect(new Date(request.request.body.expiresAtUtc).getTime()).toBeGreaterThan(Date.now());
    request.flush({ ...medevac, id: 9 });
    await fixture.whenStable();

    http.expectOne(r => r.url === '/api/admin/freelance').flush(page([medevac]));
    await fixture.whenStable();
    expect(query('[data-testid="notice"]').textContent).toContain('Job #9 created.');
    expect(query('[data-testid="job-form"]')).toBeNull();
  });

  it('does not submit without the airports', async () => {
    query<HTMLButtonElement>('[data-testid="new-job"]').click();
    await fixture.whenStable();

    query<HTMLFormElement>('[data-testid="job-form"]').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    http.expectNone('/api/admin/freelance');
    expect(query('[data-testid="job-form-invalid"]').textContent).toContain('ICAO code');
  });

  it('fills every leg when editing and shows server errors', async () => {
    query<HTMLButtonElement>('[data-testid="edit-job-8"]').click();
    await fixture.whenStable();

    expect(element().querySelectorAll('[data-testid^="leg-form-"]').length).toBe(3);
    expect(query<HTMLInputElement>('#leg-origin-1').value).toBe('SBGR');
    expect(query<HTMLInputElement>('#leg-destination-2').value).toBe('SBFL');
    query<HTMLButtonElement>('[data-testid="remove-leg-2"]').click();
    await fixture.whenStable();
    query<HTMLFormElement>('[data-testid="job-form"]').dispatchEvent(new Event('submit'));

    const request = http.expectOne(r => r.method === 'PUT' && r.url === '/api/admin/freelance/8');
    expect(request.request.body.legs.length).toBe(2);
    request.flush({ errors: { ExpiresAtUtc: ['The job must expire in the future.'] } }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    expect(query('[data-testid="job-form-error"]').textContent).toContain('must expire in the future');
  });

  it('deletes after confirming', async () => {
    query<HTMLButtonElement>('[data-testid="delete-job-7"]').click();
    await fixture.whenStable();
    query<HTMLButtonElement>('[data-testid="confirm-delete-job"]').click();

    http.expectOne(r => r.method === 'DELETE' && r.url === '/api/admin/freelance/7').flush(null);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/admin/freelance').flush(page([executiveTour]));
    await fixture.whenStable();

    expect(query('[data-testid="notice"]').textContent).toContain('Job #7 deleted.');
  });
});