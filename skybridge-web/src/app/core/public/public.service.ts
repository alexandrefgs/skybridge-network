import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LiveMap, PublicFlight, PublicStats } from './public.models';

@Injectable({ providedIn: 'root' })
export class PublicService {
  private readonly http = inject(HttpClient);

  stats(): Observable<PublicStats> {
    return this.http.get<PublicStats>('/api/public/stats');
  }

  flights(count = 4): Observable<PublicFlight[]> {
    return this.http.get<PublicFlight[]>('/api/public/flights', { params: { count } });
  }
  
  live(): Observable<LiveMap> {
    return this.http.get<LiveMap>('/api/public/live');
  }
}