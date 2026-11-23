import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminPirepService, PirepService } from './pirep.service';

describe('PirepService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('files the PIREP of the current leg', () => {
    const input = { departedAtUtc: '2026-11-23T10:00:00.000Z', arrivedAtUtc: '2026-11-23T12:20:00.000Z', fuelUsedKg: 45, landingRateFpm: 160, remarks: null };
    TestBed.inject(PirepService).file(input).subscribe();

    const request = http.expectOne('/api/pireps');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
  });

  it('loads my logbook', () => {
    TestBed.inject(PirepService).mine(2).subscribe();

    const request = http.expectOne(r => r.url === '/api/pireps/mine');
    expect(request.request.params.get('page')).toBe('2');
  });

  it('searches, approves and rejects as staff', () => {
    const admin = TestBed.inject(AdminPirepService);
    admin.search('Pending').subscribe();
    admin.search(null).subscribe();
    admin.approve(4, null).subscribe();
    admin.reject(5, 'Slew mode').subscribe();

    expect(http.expectOne(r => r.url === '/api/admin/pireps' && r.params.get('status') === 'Pending')).toBeTruthy();
    expect(http.expectOne(r => r.url === '/api/admin/pireps' && !r.params.has('status'))).toBeTruthy();
    expect(http.expectOne('/api/admin/pireps/4/approve').request.body).toEqual({ note: null });
    expect(http.expectOne('/api/admin/pireps/5/reject').request.body).toEqual({ note: 'Slew mode' });
  });
});