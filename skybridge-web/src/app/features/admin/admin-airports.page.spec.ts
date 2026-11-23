import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminAirportsPage } from './admin-airports.page';

describe('AdminAirportsPage', () => {
  it('imports airports and shows the summary', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAirportsPage],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminAirportsPage);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('[data-testid="import"]').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-testid="import"]').textContent).toContain('Importing');

    const request = http.expectOne('/api/admin/airports/import');
    expect(request.request.method).toBe('POST');
    request.flush({ added: 12, updated: 30, unchanged: 48028, total: 48070 });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="import-result"]').textContent).toContain('48,028');
  });
});