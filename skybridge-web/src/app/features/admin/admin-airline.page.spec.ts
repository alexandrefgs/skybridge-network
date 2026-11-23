import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { flnGru, golDetail, page } from '../../testing/airlines';
import { AdminAirlinePage } from './admin-airline.page';

describe('AdminAirlinePage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAirlinePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  const catalog = ['A320', 'B737', 'B738', 'B38M'].map(icaoCode => ({ icaoCode }));

  const render = async () => {
    const fixture = TestBed.createComponent(AdminAirlinePage);
    fixture.componentRef.setInput('id', '2579');
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/aircraft-types').flush(page(catalog, 4, 100));
    http.expectOne('/api/airlines/2579').flush(golDetail);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airlines/2579/routes').flush(page([flnGru]));
    await fixture.whenStable();
    return fixture;
  };

  const flushReload = async (fixture: { whenStable: () => Promise<unknown> }) => {
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airlines/2579/routes').flush(page([flnGru]));
    http.expectOne('/api/airlines/2579').flush(golDetail);
    await fixture.whenStable();
  };

  it('shows the last sync and the routes', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('[data-testid="last-sync"]')!.textContent).toContain('CGNA');
    expect(element.querySelector('[data-testid="last-sync"]')!.textContent).toContain('19 Nov 2026');
    expect(element.querySelector('[data-testid="edit-route-10"]')).not.toBeNull();
  });

  it('syncs from CGNA and shows the summary', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="sync-cgna"]')!.click();
    http.expectOne('/api/admin/airlines/2579/routes/sync-cgna').flush({
      format: 'RPL', edition: '2026-11-19', added: 293, updated: 0, unchanged: 0, skipped: 0,
      fleetAdded: ['B737'], issues: [{ line: 40, message: 'Aircraft type E295 is not in the catalog, ignored.' }]
    });
    await flushReload(fixture);

    const summary = element.querySelector('[data-testid="import-result"]')!.textContent!;
    expect(summary).toContain('293 added');
    expect(summary).toContain('B737');
    expect(element.querySelector('[data-testid="import-issues"]')!.textContent).toContain('E295');
  });

  it('uploads the chosen file', async () => {
    const fixture = await render();
    const input = fixture.nativeElement.querySelector('[data-testid="file-input"]') as HTMLInputElement;
    const file = new File(['origin,destination\nSBFL,SBGR'], 'routes.csv', { type: 'text/csv' });
    Object.defineProperty(input, 'files', { value: [file] });

    input.dispatchEvent(new Event('change'));

    const request = http.expectOne('/api/admin/airlines/2579/routes/import');
    expect((request.request.body as FormData).get('file')).toBeInstanceOf(File);
    request.flush({ format: 'CSV', edition: null, added: 1, updated: 0, unchanged: 0, skipped: 0, fleetAdded: [], issues: [] });
    await flushReload(fixture);
  });

  it('adds a route with aircraft from the fleet', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="add-route"]')!.click();
    await fixture.whenStable();
    const set = (id: string, value: string) => {
      const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    set('origin', 'sbfl');
    set('destination', 'sbsp');
    set('flightLevel', '330');
    set('atsRoute', 'uz10 buxuk');
    element.querySelector<HTMLButtonElement>('[data-testid="aircraft-B738"]')!.click();
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('[data-testid="route-form"] button[type="submit"]')!.click();

    const request = http.expectOne('/api/admin/airlines/2579/routes');
    expect(request.request.body).toEqual({ origin: 'SBFL', destination: 'SBSP', aircraft: ['B738'], atsRoute: 'UZ10 BUXUK', flightLevel: 330 });
    request.flush({ ...flnGru, id: 11, destination: 'SBSP' });
    await flushReload(fixture);

    expect(element.querySelector('[data-testid="notice"]')!.textContent).toContain('SBFL–SBSP added');
  });

  it('edits a route keeping the airports fixed', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="edit-route-10"]')!.click();
    await fixture.whenStable();
    expect(element.querySelector<HTMLInputElement>('#origin')!.disabled).toBe(true);
    element.querySelector<HTMLButtonElement>('[data-testid="aircraft-B38M"]')!.click();
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('[data-testid="route-form"] button[type="submit"]')!.click();

    const request = http.expectOne('/api/admin/airlines/2579/routes/10');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ aircraft: ['B738'], atsRoute: 'UZ10 BUXUK', flightLevel: 330 });
    request.flush(flnGru);
    await flushReload(fixture);
  });

  it('adds an aircraft type to the fleet', async () => {
    const fixture = await render();
    const select = fixture.nativeElement.querySelector('[data-testid="add-to-fleet"]') as HTMLSelectElement;

    select.value = 'A320';
    select.dispatchEvent(new Event('change'));

    const request = http.expectOne('/api/admin/airlines/2579/fleet');
    expect(request.request.body).toEqual({ aircraftTypes: ['B738', 'B38M', 'A320'] });
    request.flush(golDetail);
  });

  it('asks before deleting every route', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="delete-all-routes"]')!.click();
    await fixture.whenStable();
    http.expectNone('/api/admin/airlines/2579/routes');
    element.querySelector<HTMLButtonElement>('[data-testid="confirm-delete-all"]')!.click();

    const request = http.expectOne(r => r.method === 'DELETE' && r.url === '/api/admin/airlines/2579/routes');
    request.flush({ deleted: 293 });
    await flushReload(fixture);

    expect(element.querySelector('[data-testid="notice"]')!.textContent).toContain('293 routes deleted');
  });
});