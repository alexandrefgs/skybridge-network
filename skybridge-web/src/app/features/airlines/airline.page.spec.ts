import { Component, input } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouteNetwork } from '../../core/airlines/airline.models';
import { RouteMap } from '../../shared/map/route-map';
import { flnGru, golDetail, page } from '../../testing/airlines';
import { AirlinePage } from './airline.page';

@Component({ selector: 'sb-route-map', template: '' })
class RouteMapStub {
  readonly network = input<RouteNetwork | null>(null);
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
    expect(element.querySelector('[data-testid="network-summary"]')!.textContent).toContain('2 airports · 1 connections');
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
});