import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../http/paged-result';
import { Pirep, PirepFiled, PirepInput, PirepStatus } from './pirep.models';

export const PIREP_PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class PirepService {
  private readonly http = inject(HttpClient);

  file(input: PirepInput): Observable<PirepFiled> {
    return this.http.post<PirepFiled>('/api/pireps', input);
  }

  mine(page = 1): Observable<PagedResult<Pirep>> {
    return this.http.get<PagedResult<Pirep>>('/api/pireps/mine', { params: { page, pageSize: PIREP_PAGE_SIZE } });
  }
}

@Injectable({ providedIn: 'root' })
export class AdminPirepService {
  private readonly http = inject(HttpClient);

  search(status: PirepStatus | null, page = 1): Observable<PagedResult<Pirep>> {
    let params = new HttpParams().set('page', page).set('pageSize', PIREP_PAGE_SIZE);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<Pirep>>('/api/admin/pireps', { params });
  }

  approve(id: number, note: string | null): Observable<Pirep> {
    return this.http.post<Pirep>(`/api/admin/pireps/${id}/approve`, { note });
  }

  reject(id: number, note: string): Observable<Pirep> {
    return this.http.post<Pirep>(`/api/admin/pireps/${id}/reject`, { note });
  }
}