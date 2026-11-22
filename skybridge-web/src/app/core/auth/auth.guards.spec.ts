import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, guestGuard } from './auth.guards';

describe('auth guards', () => {
  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  const setup = (signedIn: boolean) => {
    localStorage.clear();
    if (signedIn) {
      localStorage.setItem('sb-token', JSON.stringify({ accessToken: 'jwt', expiresAtUtc: new Date(Date.now() + 3600_000).toISOString() }));
    }
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  };

  it('authGuard redirects guests to /login', () => {
    setup(false);
    const result = run(authGuard) as UrlTree;
    expect(result.toString()).toBe('/login');
  });

  it('authGuard lets signed in pilots through', () => {
    setup(true);
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard redirects signed in pilots home', () => {
    setup(true);
    const result = run(guestGuard) as UrlTree;
    expect(result.toString()).toBe('/');
  });
});