import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AirlineDetail, AirlineInput, AirlineRoute, RouteDetailsInput, RouteImportResult, RouteInput } from '../airlines/airline.models';

@Injectable({ providedIn: 'root' })
export class AdminAirlinesService {
  private readonly http = inject(HttpClient);

  create(airline: AirlineInput): Observable<AirlineDetail> {
    return this.http.post<AirlineDetail>('/api/admin/airlines', airline);
  }

  update(id: number, airline: AirlineInput): Observable<AirlineDetail> {
    return this.http.put<AirlineDetail>(`/api/admin/airlines/${id}`, airline);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/airlines/${id}`);
  }

  setFleet(id: number, aircraftTypes: string[]): Observable<AirlineDetail> {
    return this.http.put<AirlineDetail>(`/api/admin/airlines/${id}/fleet`, { aircraftTypes });
  }

  addRoute(id: number, route: RouteInput): Observable<AirlineRoute> {
    return this.http.post<AirlineRoute>(`/api/admin/airlines/${id}/routes`, route);
  }

  updateRoute(id: number, routeId: number, details: RouteDetailsInput): Observable<AirlineRoute> {
    return this.http.put<AirlineRoute>(`/api/admin/airlines/${id}/routes/${routeId}`, details);
  }

  deleteRoute(id: number, routeId: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/airlines/${id}/routes/${routeId}`);
  }

  deleteAllRoutes(id: number): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`/api/admin/airlines/${id}/routes`);
  }

  importRoutes(id: number, file: File): Observable<RouteImportResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<RouteImportResult>(`/api/admin/airlines/${id}/routes/import`, form);
  }

  syncFromCgna(id: number): Observable<RouteImportResult> {
    return this.http.post<RouteImportResult>(`/api/admin/airlines/${id}/routes/sync-cgna`, {});
  }
}