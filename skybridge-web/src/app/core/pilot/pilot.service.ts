import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pilot } from './pilot.models';

@Injectable({ providedIn: 'root' })
export class PilotService {
  private readonly http = inject(HttpClient);

  get(): Observable<Pilot> {
    return this.http.get<Pilot>('/api/pilot');
  }

  linkSimBrief(pilotId: string | null): Observable<Pilot> {
    return this.http.put<Pilot>('/api/pilot/simbrief', { pilotId });
  }

  jumpseat(airport: string): Observable<Pilot> {
    return this.http.post<Pilot>('/api/pilot/jumpseat', { airport });
  }
}