import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminFreelanceService, FreelanceService } from './freelance.service';
import { FreelanceJobInput } from './freelance.models';

describe('FreelanceService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches jobs from an airport', () => {
    TestBed.inject(FreelanceService).search({ from: 'SBFL', page: 2 }).subscribe();

    const request = http.expectOne(r => r.url === '/api/freelance');
    expect(request.request.params.get('from')).toBe('SBFL');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('10');
  });

  it('omits the airport when searching everywhere', () => {
    TestBed.inject(FreelanceService).search({ from: null, page: 1 }).subscribe();

    expect(http.expectOne(r => r.url === '/api/freelance').request.params.has('from')).toBe(false);
  });

  it('creates, updates and deletes jobs as staff', () => {
    const admin = TestBed.inject(AdminFreelanceService);
    const input = { kind: 'Charter', reward: 100, legs: [] } as unknown as FreelanceJobInput;

    admin.create(input).subscribe();
    admin.update(7, input).subscribe();
    admin.delete(7).subscribe();
    admin.search({ from: null, page: 1 }).subscribe();

    expect(http.expectOne(r => r.method === 'POST').request.url).toBe('/api/admin/freelance');
    expect(http.expectOne(r => r.method === 'PUT').request.url).toBe('/api/admin/freelance/7');
    expect(http.expectOne(r => r.method === 'DELETE').request.url).toBe('/api/admin/freelance/7');
    expect(http.expectOne(r => r.method === 'GET').request.url).toBe('/api/admin/freelance');
  });
});