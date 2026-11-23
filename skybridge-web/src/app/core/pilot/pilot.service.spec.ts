import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PilotService } from './pilot.service';

describe('PilotService', () => {
  let service: PilotService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PilotService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the pilot', () => {
    service.get().subscribe();

    expect(http.expectOne('/api/pilot').request.method).toBe('GET');
  });

  it('moves the pilot with a jumpseat', () => {
    service.jumpseat('SBFL').subscribe();

    const request = http.expectOne('/api/pilot/jumpseat');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ airport: 'SBFL' });
  });
});