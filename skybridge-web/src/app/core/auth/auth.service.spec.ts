import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { fakeJwt } from '../../testing/jwt';
import { AuthService } from './auth.service';

const future = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores the token after a successful login', () => {
    service.login('ana@skybridge.test', 'Sky!Bridge2026').subscribe();
    http.expectOne('/api/auth/login').flush({ requiresTwoFactor: false, accessToken: 'jwt', expiresAtUtc: future(), twoFactorToken: null });

    expect(service.accessToken()).toBe('jwt');
    expect(localStorage.getItem('sb-token')).toContain('jwt');
  });

  it('does not store a token when two-factor is required', () => {
    service.login('ana@skybridge.test', 'Sky!Bridge2026').subscribe();
    http.expectOne('/api/auth/login').flush({ requiresTwoFactor: true, accessToken: null, expiresAtUtc: null, twoFactorToken: 'tf' });

    expect(service.accessToken()).toBeNull();
  });

  it('stores the token after the two-factor step', () => {
    service.loginWithTwoFactor('tf', '123456').subscribe();
    const request = http.expectOne('/api/auth/login/2fa');
    expect(request.request.body).toEqual({ twoFactorToken: 'tf', code: '123456' });
    request.flush({ requiresTwoFactor: false, accessToken: 'jwt-2fa', expiresAtUtc: future(), twoFactorToken: null });

    expect(service.accessToken()).toBe('jwt-2fa');
  });

  it('treats an expired token as signed out', () => {
    localStorage.setItem('sb-token', JSON.stringify({ accessToken: 'old', expiresAtUtc: '2020-01-01T00:00:00Z' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);

    expect(TestBed.inject(AuthService).accessToken()).toBeNull();
    expect(localStorage.getItem('sb-token')).toBeNull();
  });

  it('reads the roles from the token', () => {
    service.login('ana@skybridge.test', 'Sky!Bridge2026').subscribe();
    http.expectOne('/api/auth/login').flush({
      requiresTwoFactor: false, accessToken: fakeJwt(['Admin', 'Pilot']), expiresAtUtc: future(), twoFactorToken: null
    });

    expect(service.roles()).toEqual(['Admin', 'Pilot']);
    expect(service.isStaff()).toBe(true);
  });

  it('is not staff with a pilot token', () => {
    service.login('ana@skybridge.test', 'Sky!Bridge2026').subscribe();
    http.expectOne('/api/auth/login').flush({
      requiresTwoFactor: false, accessToken: fakeJwt(['Pilot']), expiresAtUtc: future(), twoFactorToken: null
    });

    expect(service.isStaff()).toBe(false);
  });

  it('clears the session on logout', () => {
    service.login('ana@skybridge.test', 'Sky!Bridge2026').subscribe();
    http.expectOne('/api/auth/login').flush({ requiresTwoFactor: false, accessToken: 'jwt', expiresAtUtc: future(), twoFactorToken: null });

    service.logout();

    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('marks two-factor as enabled on the current user', () => {
    service.loadCurrentUser().subscribe();
    http.expectOne('/api/auth/me').flush({
      id: '1', email: 'ana@skybridge.test', firstName: 'Ana', lastName: 'Silva', twoFactorEnabled: false, roles: ['Pilot']
    });

    service.enableTwoFactor('123456').subscribe();
    http.expectOne('/api/auth/2fa/enable').flush({ recoveryCodes: ['AAAA-BBBB'] });

    expect(service.currentUser()?.twoFactorEnabled).toBe(true);
  });
});