import { Component, input, output } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouteFilter, RouteNetwork } from '../../core/airlines/airline.models';
import { RouteMap } from '../../shared/map/route-map';
import { flnGru, golDetail, page } from '../../testing/airlines';
import { bookedGolFlight, pilotAtFlorianopolis } from '../../testing/freelance';
import { AirlinePage } from './airline.page';

@Component({ selector: 'sb-route-map', template: '' })
class RouteMapStub {
  readonly network = input<RouteNetwork | null>(null);
  readonly filter = input<RouteFilter | null>(null);
  readonly filterChange = output<RouteFilter | null>();
}

const network: RouteNetwork = {
  airports: [
    { code: 'SBFL', iataCode: 'FLN', name: 'Hercílio Luz', latitude: -27.67, longitude: -48.55 },
    { code: 'SBGR', iataCode: 'GRU', name: 'Guarulhos', latitude: -23.43, longitude: -46.47 }
  ],
  links: [[0, 1]]
};

describe('AirlinePage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirlinePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
      .overrideComponent(AirlinePage, { remove: { imports: [RouteMap] }, add: { imports: [RouteMapStub] } })
      .compileComponents();
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
    http.expectOne('/api/airlines/2579/network').flush(network);
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
    expect(element.querySelector('[data-testid="network-summary"]')!.textContent).toContain('2 airports');
  });

  it('searches the routes by airport', async () => {
    const fixture = await render();
    http.expectOne('/api/airlines/2579').flush(golDetail);
    http.expectOne('/api/airlines/2579/network').flush(network);
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

    const renderWithRoutes = async () => {
    const fixture = await render();
    http.expectOne('/api/airlines/2579').flush(golDetail);
    http.expectOne('/api/airlines/2579/network').flush(network);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airlines/2579/routes').flush(page([flnGru]));
    await fixture.whenStable();
    const map = fixture.debugElement.query(By.directive(RouteMapStub)).componentInstance as RouteMapStub;
    return { fixture, map };
  };

  it('lists the departures of the airport clicked on the map', async () => {
    const { fixture, map } = await renderWithRoutes();

    map.filterChange.emit({ from: 'SBFL', to: null });
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/airlines/2579/routes');
    expect(request.request.params.get('from')).toBe('SBFL');
    expect(request.request.params.has('to')).toBe(false);
    request.flush(page([flnGru]));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-testid="route-filter"]').textContent).toContain('From SBFL');
  });

  it('shows the routes between two airports when a line is clicked on the map', async () => {
    const { fixture, map } = await renderWithRoutes();

    map.filterChange.emit({ from: 'SBGR', to: 'SBFL' });
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/airlines/2579/routes');
    expect(request.request.params.get('from')).toBe('SBGR');
    expect(request.request.params.get('to')).toBe('SBFL');
    request.flush(page([flnGru]));
    await fixture.whenStable();
    expect(map.filter()).toEqual({ from: 'SBGR', to: 'SBFL' });
    expect(fixture.nativeElement.querySelector('[data-testid="route-filter"]').textContent).toContain('SBGR ⇄ SBFL');

    fixture.nativeElement.querySelector('[data-testid="clear-filter"]').click();
    await fixture.whenStable();
    expect(http.expectOne(r => r.url === '/api/airlines/2579/routes').request.params.has('from')).toBe(false);
    expect(map.filter()).toBeNull();
  });

  it('selects the route on the map when a row is clicked', async () => {
    const { fixture, map } = await renderWithRoutes();

    fixture.nativeElement.querySelector('[data-testid="route-row-10"] td').click();
    await fixture.whenStable();

    expect(map.filter()).toEqual({ from: 'SBFL', to: 'SBGR' });
    http.expectOne(r => r.url === '/api/airlines/2579/routes').flush(page([flnGru]));
  });

  it('tags airlines that no longer operate as retro', async () => {
    const fixture = await render();
    http.expectOne('/api/airlines/2579').flush({ ...golDetail, name: 'VARIG', isActive: false });
    http.expectOne('/api/airlines/2579/network').flush({ airports: [], links: [] });
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airlines/2579/routes').flush(page([]));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="retro"]').textContent).toContain('Retro');
  });

  it('explains when the airline does not exist', async () => {
    const fixture = await render('99');
    http.expectOne('/api/airlines/99').flush(null, { status: 404, statusText: 'Not Found' });
    http.expectOne('/api/airlines/99/network').flush(null, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Airline not found.');
  });
  
  async function renderAsPilot(booking: typeof bookedGolFlight | null = null) {
    const fixture = await render();
    http.expectOne('/api/airlines/2579').flush(golDetail);
    http.expectOne('/api/airlines/2579/network').flush(network);
    http.expectOne('/api/pilot').flush(pilotAtFlorianopolis);
    http.expectOne('/api/bookings/current').flush(booking);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airlines/2579/routes').flush(page([flnGru]));
    await fixture.whenStable();
    return fixture;
  }

  it('lets a pilot at the origin book a route', async () => {
    const fixture = await renderAsPilot();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('[data-testid="fly-here"]')!.textContent).toContain('You are at SBFL');
    (element.querySelector('[data-testid="book-route-10"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(element.querySelector('[data-testid="route-booking"]')!.textContent).toContain('SBFL → SBGR');
    expect(http.match(r => r.url === '/api/airlines/2579/routes').length).toBe(0);
  });

  it('shows the departures from where the pilot is', async () => {
    const fixture = await renderAsPilot();

    (fixture.nativeElement.querySelector('[data-testid="show-departures"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(http.expectOne(r => r.url === '/api/airlines/2579/routes').request.params.get('from')).toBe('SBFL');
  });

  it('hides booking while a flight is active', async () => {
    const fixture = await renderAsPilot(bookedGolFlight);
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('[data-testid="fly-active"]')!.textContent).toContain('SBFL → SBGR · B738');
    expect(element.querySelector('[data-testid="book-route-10"]')).toBeNull();
  });
});