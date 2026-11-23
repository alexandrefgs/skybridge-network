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
    municipality: 'Florianópolis', scheduledService: true, longestRunwayFt: 7874
};

const aeroclube: Airport = {
  ident: 'SSKT', icaoCode: null, iataCode: null, name: 'Aeroclube de Santa Catarina', type: 'Small',
  latitude: -27.6, longitude: -48.6, elevationFt: null, countryCode: 'BR', regionCode: 'BR-SC',
    municipality: 'São José', scheduledService: false, longestRunwayFt: 2500
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
    http.expectOne('/api/airports/SBFL/runways').flush([
      { name: '14/32', lengthFt: 7874, widthFt: 148, surface: 'ASP', surfaceType: 'Paved', lighted: true, headingDegT: 136 },
      { name: '03/21', lengthFt: 4331, widthFt: 148, surface: 'CON', surfaceType: 'Paved', lighted: false, headingDegT: 23 }
    ]);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="runway-row"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('14/32');
    expect(rows[0].textContent).toContain('7,874 ft');
    expect(rows[0].textContent).toContain('2,400 m');
  });

  it('says when an airport has no runway data', async () => {
    const fixture = await render();

    fixture.nativeElement.querySelectorAll('[data-testid="airport-list"] button')[1].click();
    await fixture.whenStable();
    http.expectOne('/api/airports/SSKT/runways').flush([]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="no-runways"]')).not.toBeNull();
  });

  it('shows the range with seven airports per page', async () => {
    const fixture = await render(45);

    expect(fixture.nativeElement.querySelector('[data-testid="range"]').textContent).toContain('Showing 1–7 of 45');
    expect(fixture.nativeElement.querySelector('[data-testid="page"]').textContent).toContain('Page 1 of 7');
  });

  it('requests the next page', async () => {
    const fixture = await render(45);

    fixture.nativeElement.querySelector('[data-testid="next"]').click();
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/airports');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ items: [], page: 2, pageSize: 7, totalCount: 45 });
  });

  it('shows an empty state when nothing matches', async () => {
    const fixture = TestBed.createComponent(AirportsPage);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airports').flush({ items: [], page: 1, pageSize: 20, totalCount: 0 });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="empty"]')).not.toBeNull();
  });
});