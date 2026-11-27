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
  
  it('loads the wallet transactions', () => {
    service.transactions(2, 10).subscribe();

    const request = http.expectOne(r => r.url === '/api/pilot/transactions');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('10');
  });

  it('links the SimBrief pilot ID', () => {
    service.linkSimBrief('123456').subscribe();

    const request = http.expectOne('/api/pilot/simbrief');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ pilotId: '123456' });
  });

  it('moves the pilot with a jumpseat', () => {
    service.jumpseat('SBFL').subscribe();

    const request = http.expectOne('/api/pilot/jumpseat');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ airport: 'SBFL' });
  });
});