import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminCategoriesPage } from './admin-categories.page';

describe('AdminCategoriesPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoriesPage],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  const render = async () => {
    const fixture = TestBed.createComponent(AdminCategoriesPage);
    await fixture.whenStable();
    http.expectOne('/api/aircraft-categories').flush([
      { code: 'Turboprop', name: 'Turboprop', requiredHours: 25 },
      { code: 'Heavy', name: 'Heavy (wide-body)', requiredHours: 600 }
    ]);
    await fixture.whenStable();
    return fixture;
  };

  it('shows save only on the changed row', async () => {
    const fixture = await render();
    expect(fixture.nativeElement.querySelector('[data-testid="save-Turboprop"]')).toBeNull();

    const hours: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="hours-Turboprop"]');
    hours.value = '30';
    hours.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="save-Turboprop"]').disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-testid="save-Heavy"]')).toBeNull();
  });

  it('blocks negative hours', async () => {
    const fixture = await render();
    const hours: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="hours-Heavy"]');
    hours.value = '-5';
    hours.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="save-Heavy"]').disabled).toBe(true);
  });

  it('saves the new hours', async () => {
    const fixture = await render();
    const hours: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="hours-Turboprop"]');
    hours.value = '30';
    hours.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    fixture.nativeElement.querySelector('[data-testid="save-Turboprop"]').click();
    const request = http.expectOne('/api/admin/aircraft-categories/Turboprop');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ name: 'Turboprop', requiredHours: 30 });
    request.flush({ code: 'Turboprop', name: 'Turboprop', requiredHours: 30 });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="saved"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="save-Turboprop"]')).toBeNull();
  });
});