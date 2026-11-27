import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PublicService } from './public.service';

describe('PublicService', () => {
  let http: HttpTestingController;
  let service: PublicService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PublicService);
  });

  afterEach(() => http.verify());

  it('loads the public numbers and the latest flights', () => {
    service.stats().subscribe();
    service.flights(4).subscribe();

    expect(http.expectOne('/api/public/stats').request.method).toBe('GET');
    expect(http.expectOne(r => r.url === '/api/public/flights').request.params.get('count')).toBe('4');
  });
});