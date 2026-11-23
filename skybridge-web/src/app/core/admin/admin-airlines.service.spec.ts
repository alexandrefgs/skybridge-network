import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminAirlinesService } from './admin-airlines.service';

describe('AdminAirlinesService', () => {
  let service: AdminAirlinesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminAirlinesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads the route file as form data', () => {
    const file = new File(['origin,destination\nSBFL,SBGR'], 'routes.csv', { type: 'text/csv' });

    service.importRoutes(3, file).subscribe();

    const request = http.expectOne('/api/admin/airlines/3/routes/import');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    expect((request.request.body as FormData).get('file')).toBeInstanceOf(File);
    request.flush({});
  });

  it('syncs from CGNA and replaces the fleet', () => {
    service.syncFromCgna(3).subscribe();
    service.setFleet(3, ['B738']).subscribe();

    const sync = http.expectOne('/api/admin/airlines/3/routes/sync-cgna');
    const fleet = http.expectOne('/api/admin/airlines/3/fleet');
    expect(sync.request.method).toBe('POST');
    expect(fleet.request.body).toEqual({ aircraftTypes: ['B738'] });
    sync.flush({});
    fleet.flush({});
  });
});