import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AircraftType } from '../../core/aircraft/aircraft.models';
import { AdminAircraftTypesPage } from './admin-aircraft-types.page';

const c172: AircraftType = {
  icaoCode: 'C172', manufacturer: 'Cessna', model: '172 Skyhawk', category: 'SinglePiston', engineType: 'Piston',
    engineCount: 1, rangeNm: 640, cruiseSpeedKts: 124, serviceCeilingFt: 14000, seats: 4, maxCargoKg: 54,
  minRunwayFt: 1700, requiresPavedRunway: false
};

describe('AdminAircraftTypesPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAircraftTypesPage],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  const render = async () => {
    const fixture = TestBed.createComponent(AdminAircraftTypesPage);
    await fixture.whenStable();
    http.expectOne('/api/aircraft-categories').flush([{ code: 'SinglePiston', name: 'Single piston', requiredHours: 0 }]);
    http.expectOne(r => r.url === '/api/aircraft-types').flush({ items: [c172], page: 1, pageSize: 10, totalCount: 1 });
    await fixture.whenStable();
    return fixture;
  };

  const type = (element: HTMLElement, id: string, value: string) => {
    const input = element.querySelector<HTMLInputElement>('#' + id)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('creates a new aircraft type and reloads the list', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="new-type"]')!.click();
    await fixture.whenStable();
    type(element, 'icaoCode', 'C182');
    type(element, 'manufacturer', 'Cessna');
    type(element, 'model', '182 Skylane');
    type(element, 'engineCount', '1');
    type(element, 'rangeNm', '915');
    type(element, 'cruiseSpeedKts', '145');
    type(element, 'serviceCeilingFt', '18100');
    type(element, 'seats', '4');
    type(element, 'maxCargoKg', '50');
    type(element, 'minRunwayFt', '1900');
    element.querySelector<HTMLButtonElement>('[data-testid="type-form"] button[type="submit"]')!.click();

    const request = http.expectOne('/api/admin/aircraft-types');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({ icaoCode: 'C182', model: '182 Skylane', rangeNm: 915, serviceCeilingFt: 18100, maxCargoKg: 50, category: 'SinglePiston' });
    expect(request.request.body).toMatchObject({ minRunwayFt: 1900, requiresPavedRunway: false });
    request.flush({ ...c172, icaoCode: 'C182' });
    await fixture.whenStable();

    http.expectOne(r => r.url === '/api/aircraft-types').flush({ items: [c172], page: 1, pageSize: 10, totalCount: 2 });
    await fixture.whenStable();
    expect(element.querySelector('[data-testid="type-form"]')).toBeNull();
    expect(element.querySelector('[data-testid="notice"]')!.textContent).toContain('C182 created.');
  });

  it('confirms an update and clears the message when editing again', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="edit-C172"]')!.click();
    await fixture.whenStable();
    expect(element.querySelector<HTMLInputElement>('#serviceCeilingFt')!.value).toBe('14000');
    expect(element.querySelector<HTMLInputElement>('#minRunwayFt')!.value).toBe('1700');
    expect(element.querySelector('[data-testid="types"]')!.textContent).toContain('14,000 ft');
    expect(element.querySelector('[data-testid="runway-C172"]')!.textContent).toContain('1,700 ft');
    const paved = element.querySelector<HTMLInputElement>('[data-testid="requires-paved"]')!;
    expect(paved.checked).toBe(false);
    paved.click();
    element.querySelector<HTMLButtonElement>('[data-testid="type-form"] button[type="submit"]')!.click();

    const update = http.expectOne('/api/admin/aircraft-types/C172');
    expect(update.request.body).toMatchObject({ minRunwayFt: 1700, requiresPavedRunway: true });
    update.flush(c172);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/aircraft-types').flush({ items: [c172], page: 1, pageSize: 10, totalCount: 1 });
    await fixture.whenStable();
    expect(element.querySelector('[data-testid="notice"]')!.textContent).toContain('C172 updated.');

    element.querySelector<HTMLButtonElement>('[data-testid="edit-C172"]')!.click();
    await fixture.whenStable();
    expect(element.querySelector('[data-testid="notice"]')).toBeNull();
  });

  it('starts a new type with empty numbers', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="new-type"]')!.click();
    await fixture.whenStable();

    expect(element.querySelector<HTMLInputElement>('#rangeNm')!.value).toBe('');
    expect(element.querySelector<HTMLInputElement>('#engineCount')!.value).toBe('');
  });

  it('shows the error under each invalid field and does not submit', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="new-type"]')!.click();
    await fixture.whenStable();
    type(element, 'icaoCode', 'C680');
    type(element, 'seats', '0');
    element.querySelector<HTMLButtonElement>('[data-testid="type-form"] button[type="submit"]')!.click();
    await fixture.whenStable();

    http.expectNone('/api/admin/aircraft-types');
    expect(element.querySelector('[data-testid="error-icaoCode"]')).toBeNull();
    expect(element.querySelector('[data-testid="error-manufacturer"]')!.textContent).toContain('Required.');
    expect(element.querySelector('[data-testid="error-seats"]')!.textContent).toContain('Must be at least 1.');
    expect(element.querySelector('[data-testid="error-serviceCeilingFt"]')!.textContent).toContain('Required.');
    expect(element.querySelector('[data-testid="error-minRunwayFt"]')!.textContent).toContain('Required.');
    expect(element.querySelector('#manufacturer')!.classList).toContain('ng-invalid');
  });

  it('explains an invalid ICAO code', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="new-type"]')!.click();
    await fixture.whenStable();
    type(element, 'icaoCode', 'B-38');
    element.querySelector<HTMLButtonElement>('[data-testid="type-form"] button[type="submit"]')!.click();
    await fixture.whenStable();

    expect(element.querySelector('[data-testid="error-icaoCode"]')!.textContent).toContain('2 to 4 letters or digits');
  });

  it('shows the server error when the code already exists', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="edit-C172"]')!.click();
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('[data-testid="type-form"] button[type="submit"]')!.click();

    const request = http.expectOne('/api/admin/aircraft-types/C172');
    expect(request.request.method).toBe('PUT');
    request.flush(
      { title: 'Conflict', errors: { IcaoCode: ["Aircraft type 'C172' already exists."] } },
      { status: 409, statusText: 'Conflict' }
    );
    await fixture.whenStable();

    expect(element.querySelector('[data-testid="form-error"]')!.textContent).toContain('already exists');
  });

  it('asks for confirmation before deleting', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="delete-C172"]')!.click();
    await fixture.whenStable();
    http.expectNone('/api/admin/aircraft-types/C172');

    element.querySelector<HTMLButtonElement>('[data-testid="confirm-delete"]')!.click();
    const request = http.expectOne('/api/admin/aircraft-types/C172');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    http.expectOne(r => r.url === '/api/aircraft-types').flush({ items: [], page: 1, pageSize: 10, totalCount: 0 });
    await fixture.whenStable();
    expect(element.querySelector('[data-testid="notice"]')!.textContent).toContain('C172 deleted.');
  });
});