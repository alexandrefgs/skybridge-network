import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../http/paged-result';
import { Pilot, PilotTransaction } from './pilot.models';

@Injectable({ providedIn: 'root' })
export class PilotService {
  private readonly http = inject(HttpClient);

  get(): Observable<Pilot> {
    return this.http.get<Pilot>('/api/pilot');
  }

  linkNetworks(vatsimId: number | null, ivaoId: number | null): Observable<Pilot> {
    return this.http.put<Pilot>('/api/pilot/networks', { vatsimId, ivaoId });
  }

  linkSimBrief(pilotId: string | null): Observable<Pilot> {
    return this.http.put<Pilot>('/api/pilot/simbrief', { pilotId });
  }
  
  transactions(page = 1, pageSize = 20): Observable<PagedResult<PilotTransaction>> {
    return this.http.get<PagedResult<PilotTransaction>>('/api/pilot/transactions', { params: { page, pageSize } });
  }

  jumpseat(airport: string): Observable<Pilot> {
    return this.http.post<Pilot>('/api/pilot/jumpseat', { airport });
  }
}