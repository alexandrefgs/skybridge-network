export function fakeJwt(roles: string[]): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '1', role: roles })}.signature`;
}

export function signInAs(roles: string[]): void {
  localStorage.setItem('sb-token', JSON.stringify({ accessToken: fakeJwt(roles), expiresAtUtc: new Date(Date.now() + 3600_000).toISOString() }));
}