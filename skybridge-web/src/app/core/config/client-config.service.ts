import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

interface ClientConfig {
  cartoApiKey: string | null;
  contactEmail: string | null;
  discordUrl: string | null;
  instagramUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientConfigService {
  private readonly http = inject(HttpClient);

  readonly cartoApiKey = signal<string | null>(null);
  readonly contactEmail = signal<string | null>(null);
  readonly discordUrl = signal<string | null>(null);
  readonly instagramUrl = signal<string | null>(null);

  load(): Observable<void> {
    return this.http.get<ClientConfig>('/api/config/client').pipe(
      tap(config => {
        this.cartoApiKey.set(config.cartoApiKey);
        this.contactEmail.set(config.contactEmail ?? null);
        this.discordUrl.set(config.discordUrl ?? null);
        this.instagramUrl.set(config.instagramUrl ?? null);
      }),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }
}