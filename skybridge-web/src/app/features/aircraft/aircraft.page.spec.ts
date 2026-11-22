import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AircraftCategory, AircraftType } from '../../core/aircraft/aircraft.models';
import { AircraftPage } from './aircraft.page';

const categories: AircraftCategory[] = [
  { code: 'SinglePiston', name: 'Single piston', requiredHours: 0 },
  { code: 'Turboprop', name: 'Turboprop', requiredHours: 25 },
  { code: 'Heavy', name: 'Heavy (wide-body)', requiredHours: 600 }
];

const b77w: AircraftType = {
  icaoCode: 'B77W', manufacturer: 'Boeing', model: '777-300ER', category: 'Heavy', engineType: 'Jet',
  engineCount: 2, rangeNm: 7370, cruiseSpeedKts: 490, seats: 396, maxCargoKg: 25000
};

const c172: AircraftType = {
  icaoCode: 'C172', manufacturer: 'Cessna', model: '172 Skyhawk', category: 'SinglePiston', engineType: 'Piston',
  engineCount: 1, rangeNm: 640, cruiseSpeedKts: 124, seats: 4, maxCargoKg: 54
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

  const render = async () => {
    const fixture = TestBed.createComponent(AircraftPage);
    await fixture.whenStable();
    http.expectOne('/api/aircraft-categories').flush(categories);
    await new Promise(resolve => setTimeout(resolve, 350));
    http.expectOne(r => r.url === '/api/aircraft-types').flush([c172, b77w]);
    await fixture.whenStable();
    return fixture;
  };

  it('shows the hour progression and the aircraft list', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('[data-testid="categories"]')!.textContent).toContain('600 h');
    expect(element.querySelectorAll('[data-testid="types"] tbody tr').length).toBe(2);
    expect(element.querySelector('[data-testid="types"]')!.textContent).toContain('7,370 nm');
  });

  it('filters by category when a category is clicked', async () => {
    const fixture = await render();

    fixture.nativeElement.querySelectorAll('[data-testid="categories"] button')[2].click();
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/aircraft-types');
    expect(request.request.params.get('category')).toBe('Heavy');
    request.flush([b77w]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="count"]').textContent).toContain('1 type');
  });
});