import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../http/paged-result';
import { AircraftCategory, AircraftType, AircraftTypeQuery } from './aircraft.models';

export const AIRCRAFT_PAGE_SIZES = [5, 10, 20, 50, 100] as const;
export const DEFAULT_AIRCRAFT_PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class AircraftService {
  private readonly http = inject(HttpClient);

  categories(): Observable<AircraftCategory[]> {
    return this.http.get<AircraftCategory[]>('/api/aircraft-categories');
  }

  types(query: AircraftTypeQuery): Observable<PagedResult<AircraftType>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.category) params = params.set('category', query.category);
    if (query.search) params = params.set('q', query.search);
    return this.http.get<PagedResult<AircraftType>>('/api/aircraft-types', { params });
  }
}