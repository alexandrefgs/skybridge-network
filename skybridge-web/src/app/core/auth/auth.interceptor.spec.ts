import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  const signIn = () =>
    localStorage.setItem('sb-token', JSON.stringify({ accessToken: 'jwt', expiresAtUtc: new Date(Date.now() + 3600_000).toISOString() }));

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => controller.verify());

  it('adds the bearer token to API requests', () => {
    signIn();
    setup();

    http.get('/api/auth/me').subscribe();

    expect(controller.expectOne('/api/auth/me').request.headers.get('Authorization')).toBe('Bearer jwt');
  });

  it('does not add a token when signed out', () => {
    setup();

    http.get('/api/auth/me').subscribe({ error: () => undefined });

    expect(controller.expectOne('/api/auth/me').request.headers.has('Authorization')).toBe(false);
  });

  it('signs out and redirects to login on 401', () => {
    signIn();
    setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    http.get('/api/auth/me').subscribe({ error: () => undefined });
    controller.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(AuthService).accessToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});