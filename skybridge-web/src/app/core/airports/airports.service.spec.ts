import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AirportsService } from './airports.service';

describe('AirportsService', () => {
  let service: AirportsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AirportsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends search, country and paging parameters', () => {
    service.search({ search: 'FLN', country: 'BR', page: 2 }).subscribe();

    const request = http.expectOne(r => r.url === '/api/airports');
    expect(request.request.params.get('q')).toBe('FLN');
    expect(request.request.params.get('country')).toBe('BR');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('20');
    request.flush({ items: [], page: 2, pageSize: 20, totalCount: 0 });
  });

  it('omits empty filters', () => {
    service.search({ search: '', country: '', page: 1 }).subscribe();

    const request = http.expectOne(r => r.url === '/api/airports');
    expect(request.request.params.has('q')).toBe(false);
    expect(request.request.params.has('country')).toBe(false);
    request.flush({ items: [], page: 1, pageSize: 20, totalCount: 0 });
  });
});