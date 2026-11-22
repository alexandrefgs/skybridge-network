import { authGuard } from './core/auth/auth.guards';
import { routes } from './app.routes';

describe('routes', () => {
  it.each(['airports', 'aircraft', 'account/security'])('requires sign in for /%s', path => {
    const route = routes.find(r => r.path === path);

    expect(route?.canActivate).toContain(authGuard);
  });
});