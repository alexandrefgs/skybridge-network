import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Airport } from '../../core/airports/airport.models';
import { AirportMap } from '../../shared/map/airport-map';
import { AirportsPage } from './airports.page';

@Component({ selector: 'sb-airport-map', template: '' })
class AirportMapStub {
  readonly airports = input<Airport[]>([]);
  readonly selected = input<Airport | null>(null);
  readonly airportClick = output<Airport>();
}

const florianopolis: Airport = {
  ident: 'SBFL', icaoCode: 'SBFL', iataCode: 'FLN', name: 'Hercílio Luz International Airport', type: 'Large',
  latitude: -27.670279, longitude: -48.552502, elevationFt: 16, countryCode: 'BR', regionCode: 'BR-SC',
  municipality: 'Florianópolis', scheduledService: true
};

const aeroclube: Airport = {
  ident: 'SSKT', icaoCode: null, iataCode: null, name: 'Aeroclube de Santa Catarina', type: 'Small',
  latitude: -27.6, longitude: -48.6, elevationFt: null, countryCode: 'BR', regionCode: 'BR-SC',
  municipality: 'São José', scheduledService: false
};

describe('AirportsPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirportsPage],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
      .overrideComponent(AirportsPage, { remove: { imports: [AirportMap] }, add: { imports: [AirportMapStub] } })
      .compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  const render = async (totalCount = 2) => {
    const fixture = TestBed.createComponent(AirportsPage);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airports').flush({ items: [florianopolis, aeroclube], page: 1, pageSize: 20, totalCount });
    await fixture.whenStable();
    return fixture;
  };

  it('lists the airports returned by the API', async () => {
    const fixture = await render();
    const list: HTMLElement = fixture.nativeElement.querySelector('[data-testid="airport-list"]');

    expect(list.querySelectorAll('li').length).toBe(2);
    expect(list.textContent).toContain('SBFL');
    expect(list.textContent).toContain('Aeroclube de Santa Catarina');
  });

  it('shows details when an airport is selected', async () => {
    const fixture = await render();

    fixture.nativeElement.querySelector('[data-testid="airport-list"] button').click();
    await fixture.whenStable();

    const details: HTMLElement = fixture.nativeElement.querySelector('[data-testid="airport-details"]');
    expect(details.textContent).toContain('Hercílio Luz International Airport');
    expect(details.textContent).toContain('16 ft');
  });

  it('requests the next page', async () => {
    const fixture = await render(45);

    fixture.nativeElement.querySelector('[data-testid="next"]').click();
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/airports');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ items: [], page: 2, pageSize: 20, totalCount: 45 });
  });

  it('shows an empty state when nothing matches', async () => {
    const fixture = TestBed.createComponent(AirportsPage);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airports').flush({ items: [], page: 1, pageSize: 20, totalCount: 0 });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="empty"]')).not.toBeNull();
  });
});