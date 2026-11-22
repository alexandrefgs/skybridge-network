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

  it('sends category, search and paging parameters', () => {
    service.types({ category: 'Heavy', search: 'Boeing', page: 2, pageSize: 50 }).subscribe();

    const request = http.expectOne(r => r.url === '/api/aircraft-types');
    expect(request.request.params.get('category')).toBe('Heavy');
    expect(request.request.params.get('q')).toBe('Boeing');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('50');
    request.flush({ items: [], page: 2, pageSize: 50, totalCount: 0 });
  });

  it('omits empty filters', () => {
    service.types({ category: null, search: '', page: 1, pageSize: 10 }).subscribe();

    const request = http.expectOne(r => r.url === '/api/aircraft-types');
    expect(request.request.params.has('category')).toBe(false);
    expect(request.request.params.has('q')).toBe(false);
    request.flush({ items: [], page: 1, pageSize: 20, totalCount: 0 });
  });
});