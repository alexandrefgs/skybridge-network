import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../http/paged-result';
import { Airline, AirlineDetail, AirlineQuery, AirlineRoute, RouteFilter, RouteNetwork, RouteQuery } from './airline.models';

export const AIRLINES_PAGE_SIZE = 15;
export const ROUTES_PAGE_SIZE = 15;

@Injectable({ providedIn: 'root' })
export class AirlinesService {
  private readonly http = inject(HttpClient);

  search(query: AirlineQuery): Observable<PagedResult<Airline>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.search) params = params.set('q', query.search);
    if (query.active !== null) params = params.set('active', query.active);
    return this.http.get<PagedResult<Airline>>('/api/airlines', { params });
  }

  get(id: number): Observable<AirlineDetail> {
    return this.http.get<AirlineDetail>(`/api/airlines/${id}`);
  }

  network(id: number): Observable<RouteNetwork> {
    return this.http.get<RouteNetwork>(`/api/airlines/${id}/network`);
  }

  routes(id: number, query: RouteQuery, filter: RouteFilter | null = null): Observable<PagedResult<AirlineRoute>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.search) params = params.set('q', query.search);
    if (filter) params = params.set('from', filter.from);
    if (filter?.to) params = params.set('to', filter.to);
    return this.http.get<PagedResult<AirlineRoute>>(`/api/airlines/${id}/routes`, { params });
  }
}