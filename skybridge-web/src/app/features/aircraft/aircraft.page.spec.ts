import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AircraftCategory, AircraftType } from '../../core/aircraft/aircraft.models';
import { AircraftPage } from './aircraft.page';

const categories: AircraftCategory[] = [
  { code: 'SinglePiston', name: 'Single piston', requiredHours: 0, payPerHour: 0 },
  { code: 'Turboprop', name: 'Turboprop', requiredHours: 25, payPerHour: 0 },
  { code: 'Heavy', name: 'Heavy (wide-body)', requiredHours: 600, payPerHour: 0 }
];

const b77w: AircraftType = {
  icaoCode: 'B77W', manufacturer: 'Boeing', model: '777-300ER', category: 'Heavy', engineType: 'Jet',
    engineCount: 2, rangeNm: 7370, cruiseSpeedKts: 490, serviceCeilingFt: 43100, seats: 396, maxCargoKg: 25000,
  minRunwayFt: 8500, requiresPavedRunway: true, family: 'Boeing 777'
};

const c172: AircraftType = {
  icaoCode: 'C172', manufacturer: 'Cessna', model: '172 Skyhawk', category: 'SinglePiston', engineType: 'Piston',
    engineCount: 1, rangeNm: 640, cruiseSpeedKts: 124, serviceCeilingFt: 14000, seats: 4, maxCargoKg: 54,
  minRunwayFt: 1700, requiresPavedRunway: false, family: null
};

describe('AircraftPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AircraftPage],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  const render = async (totalCount = 2) => {
    const fixture = TestBed.createComponent(AircraftPage);
    await fixture.whenStable();
    http.expectOne('/api/aircraft-categories').flush(categories);
    http.expectOne(r => r.url === '/api/aircraft-types').flush({ items: [c172, b77w], page: 1, pageSize: 10, totalCount });
    await fixture.whenStable();
    return fixture;
  };

  it('shows the hour progression and the aircraft list', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('[data-testid="categories"]')!.textContent).toContain('600 h');
    expect(element.querySelectorAll('[data-testid="types"] tbody tr').length).toBe(2);
    expect(element.querySelector('[data-testid="types"]')!.textContent).toContain('7,370 nm');
    expect(element.querySelector('[data-testid="runway-B77W"]')!.textContent).toContain('8,500 ft');
    expect(element.querySelector('[data-testid="runway-B77W"]')!.textContent).not.toContain('any');
    expect(element.querySelector('[data-testid="runway-C172"]')!.textContent).toContain('any');
    expect(element.querySelector('[data-testid="family-B77W"]')!.textContent).toContain('Boeing 777 family');
    expect(element.querySelector('[data-testid="family-C172"]')).toBeNull();
  });

  it('filters by category when a category is clicked', async () => {
    const fixture = await render();

    fixture.nativeElement.querySelectorAll('[data-testid="categories"] button')[2].click();
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/aircraft-types');
    expect(request.request.params.get('category')).toBe('Heavy');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ items: [b77w], page: 1, pageSize: 10, totalCount: 1 });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="count"]').textContent).toContain('1 type');
  });

  it('pages through the list', async () => {
    const fixture = await render(47);

    expect(fixture.nativeElement.querySelector('[data-testid="page"]').textContent).toContain('Page 1 of 5');
    fixture.nativeElement.querySelector('[data-testid="next"]').click();
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/aircraft-types');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('10');
    request.flush({ items: [c172], page: 2, pageSize: 10, totalCount: 47 });
  });

  it('changes the page size and goes back to the first page', async () => {
    const fixture = await render(47);
    fixture.nativeElement.querySelector('[data-testid="next"]').click();
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/aircraft-types').flush({ items: [c172], page: 2, pageSize: 10, totalCount: 47 });
    await fixture.whenStable();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('[data-testid="page-size"]');
    select.value = '50';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/aircraft-types');
    expect(request.request.params.get('pageSize')).toBe('50');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ items: [c172, b77w], page: 1, pageSize: 50, totalCount: 47 });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="range"]').textContent).toContain('Showing 1–47 of 47');
    expect(fixture.nativeElement.querySelector('[data-testid="page"]')).toBeNull();
  });
});