import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AirlinesService } from './airlines.service';

describe('AirlinesService', () => {
  let service: AirlinesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AirlinesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches with the query, the active filter and the page', () => {
    service.search({ search: 'GLO', active: true, page: 2, pageSize: 15 }).subscribe();

    const request = http.expectOne(r => r.url === '/api/airlines');
    expect(request.request.params.get('q')).toBe('GLO');
    expect(request.request.params.get('active')).toBe('true');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ items: [], page: 2, pageSize: 15, totalCount: 0 });
  });

  it('leaves the active filter out when showing every airline', () => {
    service.search({ search: '', active: null, page: 1, pageSize: 15 }).subscribe();

    const request = http.expectOne(r => r.url === '/api/airlines');
    expect(request.request.params.has('active')).toBe(false);
    expect(request.request.params.has('q')).toBe(false);
    request.flush({ items: [], page: 1, pageSize: 15, totalCount: 0 });
  });

  it('loads the route network of an airline', () => {
    service.network(7).subscribe();

    http.expectOne('/api/airlines/7/network').flush({ airports: [], links: [] });
  });

  it('filters the routes between two airports', () => {
    service.routes(7, { search: '', page: 1, pageSize: 15 }, { from: 'SBFL', to: 'SBGR' }).subscribe();

    const request = http.expectOne(r => r.url === '/api/airlines/7/routes');
    expect(request.request.params.get('from')).toBe('SBFL');
    expect(request.request.params.get('to')).toBe('SBGR');
    request.flush({ items: [], page: 1, pageSize: 15, totalCount: 0 });
  });

  it('lists the routes of an airline', () => {
    service.routes(7, { search: 'SBFL', page: 1, pageSize: 15 }).subscribe();

    const request = http.expectOne(r => r.url === '/api/airlines/7/routes');
    expect(request.request.params.get('q')).toBe('SBFL');
    request.flush({ items: [], page: 1, pageSize: 15, totalCount: 0 });
  });
});