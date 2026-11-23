import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BookingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('returns null when there is no active flight', () => {
    let result: unknown = 'unset';
    service.current().subscribe(booking => (result = booking));

    http.expectOne('/api/bookings/current').flush(null, { status: 204, statusText: 'No Content' });

    expect(result).toBeNull();
  });

  it('accepts a freelance job with the chosen aircraft', () => {
    service.acceptFreelance(7, 'C208').subscribe();

    const request = http.expectOne('/api/freelance/7/accept');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ aircraft: 'C208' });
  });

  it('books an airline route with the chosen aircraft', () => {
    service.bookRoute(42, 'A320').subscribe();

    const request = http.expectOne('/api/bookings/routes/42');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ aircraft: 'A320' });
  });

  it('starts the leg and cancels the flight', () => {
    service.startLeg().subscribe();
    service.cancel().subscribe();

    expect(http.expectOne('/api/bookings/current/start').request.method).toBe('POST');
    expect(http.expectOne('/api/bookings/current/cancel').request.method).toBe('POST');
  });
});