import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { flnGru, golDetail, page } from '../../testing/airlines';
import { AirlinePage } from './airline.page';

describe('AirlinePage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirlinePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  const render = async (id = '2579') => {
    const fixture = TestBed.createComponent(AirlinePage);
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
    return fixture;
  };

  it('shows the airline, its fleet, the last update and the routes', async () => {
    const fixture = await render();
    http.expectOne('/api/airlines/2579').flush(golDetail);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airlines/2579/routes').flush(page([flnGru], 293));
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('[data-testid="airline-name"]')!.textContent).toContain('Gol Transportes Aéreos');
    expect(element.querySelector('[data-testid="fleet"]')!.textContent).toContain('737 MAX 8');
    expect(element.querySelector('[data-testid="routes-updated"]')!.textContent).toContain('CGNA');
    expect(element.querySelector('[data-testid="routes"]')!.textContent).toContain('UZ10 BUXUK');
    expect(element.querySelector('[data-testid="route-count"]')!.textContent).toContain('293');
    expect(element.querySelector('[data-testid="routes"] th:last-child')!.textContent).toContain('Route');
  });

  it('searches the routes by airport', async () => {
    const fixture = await render();
    http.expectOne('/api/airlines/2579').flush(golDetail);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airlines/2579/routes').flush(page([flnGru]));
    await fixture.whenStable();

    const search = fixture.nativeElement.querySelector('[data-testid="route-search"]') as HTMLInputElement;
    search.value = 'SBFL';
    search.dispatchEvent(new Event('input'));
    await new Promise(resolve => setTimeout(resolve, 350));
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/airlines/2579/routes');
    expect(request.request.params.get('q')).toBe('SBFL');
    request.flush(page([flnGru]));
  });

  it('explains when the airline does not exist', async () => {
    const fixture = await render('99');
    http.expectOne('/api/airlines/99').flush(null, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Airline not found.');
  });
});