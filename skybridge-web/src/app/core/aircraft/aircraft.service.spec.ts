import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AircraftService } from './aircraft.service';

describe('AircraftService', () => {
  let service: AircraftService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AircraftService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('filters types by category and search', () => {
    service.types('Heavy', 'Boeing').subscribe();

    const request = http.expectOne(r => r.url === '/api/aircraft-types');
    expect(request.request.params.get('category')).toBe('Heavy');
    expect(request.request.params.get('q')).toBe('Boeing');
    request.flush([]);
  });

  it('omits empty filters', () => {
    service.types(null, '').subscribe();

    const request = http.expectOne(r => r.url === '/api/aircraft-types');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([]);
  });
});