import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

interface ClientConfig {
  cartoApiKey: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientConfigService {
  private readonly http = inject(HttpClient);

  readonly cartoApiKey = signal<string | null>(null);

  load(): Observable<void> {
    return this.http.get<ClientConfig>('/api/config/client').pipe(
      tap(config => this.cartoApiKey.set(config.cartoApiKey)),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }
}