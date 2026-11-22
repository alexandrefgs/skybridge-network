import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Airport, AirportQuery, PagedResult } from './airport.models';

export const AIRPORTS_PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class AirportsService {
  private readonly http = inject(HttpClient);

  search(query: AirportQuery): Observable<PagedResult<Airport>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', AIRPORTS_PAGE_SIZE);
    if (query.search) params = params.set('q', query.search);
    if (query.country) params = params.set('country', query.country);
    return this.http.get<PagedResult<Airport>>('/api/airports', { params });
  }

  get(ident: string): Observable<Airport> {
    return this.http.get<Airport>(`/api/airports/${encodeURIComponent(ident)}`);
  }
}