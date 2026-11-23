import { CurrentUser } from '../core/auth/auth.models';

export function aUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: '1',
    email: 'ana@skybridge.test',
    firstName: 'Ana',
    lastName: 'Silva',
    twoFactorEnabled: false,
    roles: ['Pilot'],
    avatarUrl: null,
    ...overrides
  };
}