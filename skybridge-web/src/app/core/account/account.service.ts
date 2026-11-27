import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AccountState, Regulations } from './account.models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly state = signal<AccountState | null>(null);

  load(): Observable<AccountState> {
    return this.http.get<AccountState>('/api/account/status').pipe(tap(state => this.state.set(state)));
  }

  reactivate(): Observable<AccountState> {
    return this.http.post<AccountState>('/api/account/reactivate', {}).pipe(tap(state => this.state.set(state)));
  }

  acceptRegulations(version: number): Observable<AccountState> {
    return this.http.post<AccountState>('/api/account/regulations/accept', { version }).pipe(tap(state => this.state.set(state)));
  }

  deleteAccount(password: string): Observable<void> {
    return this.http.delete<void>('/api/account', { body: { password } }).pipe(
      tap(() => {
        this.state.set(null);
        this.auth.logout();
      })
    );
  }

  regulations(): Observable<Regulations> {
    return this.http.get<Regulations>('/api/public/regulations');
  }
}