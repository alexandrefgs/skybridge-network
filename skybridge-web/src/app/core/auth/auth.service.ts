import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CurrentUser, LoginResponse, RecoveryCodes, RegisterRequest, TwoFactorSetup } from './auth.models';

const TOKEN_KEY = 'sb-token';

interface StoredToken {
  accessToken: string;
  expiresAtUtc: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly token = signal<StoredToken | null>(readStoredToken());

  readonly currentUser = signal<CurrentUser | null>(null);
  readonly isSignedIn = computed(() => this.token() !== null);
  readonly roles = computed(() => rolesFromToken(this.token()?.accessToken));
  readonly isStaff = computed(() => this.roles().some(role => role === 'Admin' || role === 'Staff'));

  accessToken(): string | null {
    const token = this.token();
    if (!token) return null;
    if (new Date(token.expiresAtUtc).getTime() <= Date.now()) {
      this.logout();
      return null;
    }
    return token.accessToken;
  }

  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/register', request).pipe(tap(r => this.storeToken(r)));
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(tap(r => this.storeToken(r)));
  }

  loginWithTwoFactor(twoFactorToken: string, code: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login/2fa', { twoFactorToken, code })
      .pipe(tap(r => this.storeToken(r)));
  }

  loadCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>('/api/auth/me').pipe(tap(user => this.currentUser.set(user)));
  }

  setupTwoFactor(): Observable<TwoFactorSetup> {
    return this.http.post<TwoFactorSetup>('/api/auth/2fa/setup', {});
  }

  enableTwoFactor(code: string): Observable<RecoveryCodes> {
    return this.http
      .post<RecoveryCodes>('/api/auth/2fa/enable', { code })
      .pipe(tap(() => this.setTwoFactorEnabled(true)));
  }

  disableTwoFactor(code: string): Observable<void> {
    return this.http
      .post<void>('/api/auth/2fa/disable', { code })
      .pipe(tap(() => this.setTwoFactorEnabled(false)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  private storeToken(response: LoginResponse): void {
    if (!response.accessToken || !response.expiresAtUtc) return;
    const stored: StoredToken = { accessToken: response.accessToken, expiresAtUtc: response.expiresAtUtc };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
    this.token.set(stored);
  }

  private setTwoFactorEnabled(enabled: boolean): void {
    this.currentUser.update(user => (user ? { ...user, twoFactorEnabled: enabled } : user));
  }
}

function readStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredToken) : null;
  } catch {
    return null;
  }
}

function rolesFromToken(accessToken: string | undefined): string[] {
  if (!accessToken) return [];
  try {
    const payload = accessToken.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const role = (JSON.parse(atob(base64)) as { role?: string | string[] }).role;
    return Array.isArray(role) ? role : role ? [role] : [];
  } catch {
    return [];
  }
}