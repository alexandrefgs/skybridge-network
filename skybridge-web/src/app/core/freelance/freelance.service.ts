import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../http/paged-result';
import { FreelanceJob, FreelanceJobInput, FreelanceQuery } from './freelance.models';

export const FREELANCE_PAGE_SIZE = 10;

function searchParams(query: FreelanceQuery): HttpParams {
  let params = new HttpParams().set('page', query.page).set('pageSize', FREELANCE_PAGE_SIZE);
  if (query.from) params = params.set('from', query.from);
  return params;
}

@Injectable({ providedIn: 'root' })
export class FreelanceService {
  private readonly http = inject(HttpClient);

  search(query: FreelanceQuery): Observable<PagedResult<FreelanceJob>> {
    return this.http.get<PagedResult<FreelanceJob>>('/api/freelance', { params: searchParams(query) });
  }
}

@Injectable({ providedIn: 'root' })
export class AdminFreelanceService {
  private readonly http = inject(HttpClient);

  search(query: FreelanceQuery): Observable<PagedResult<FreelanceJob>> {
    return this.http.get<PagedResult<FreelanceJob>>('/api/admin/freelance', { params: searchParams(query) });
  }

  create(input: FreelanceJobInput): Observable<FreelanceJob> {
    return this.http.post<FreelanceJob>('/api/admin/freelance', input);
  }

  update(id: number, input: FreelanceJobInput): Observable<FreelanceJob> {
    return this.http.put<FreelanceJob>(`/api/admin/freelance/${id}`, input);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/freelance/${id}`);
  }
}