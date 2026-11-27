import { authGuard, staffGuard } from './core/auth/auth.guards';
import { routes } from './app.routes';

describe('routes', () => {
  it.each(['airports', 'aircraft', 'airlines', 'airlines/:id', 'freelance', 'flight', 'cockpit', 'logbook', 'wallet', 'account'])('requires sign in for /%s', path => {
    const route = routes.find(r => r.path === path);

    expect(route?.canActivate).toContain(authGuard);
  });

  it('requires staff for /admin', () => {
    const route = routes.find(r => r.path === 'admin');

    expect(route?.canActivate).toEqual([authGuard, staffGuard]);
  });
  
  it.each(['', 'about', 'operations', 'flights'])('keeps /%s open to visitors', path => {
    expect(routes.find(r => r.path === path)?.canActivate).toBeUndefined();
  });
});