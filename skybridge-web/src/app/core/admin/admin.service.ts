import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AircraftCategory, AircraftCategoryCode, AircraftType } from '../aircraft/aircraft.models';
import { AirportCatalogImportResult } from '../airports/airport.models';

export interface CategoryUpdate {
  name: string;
  requiredHours: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  updateCategory(code: AircraftCategoryCode, update: CategoryUpdate): Observable<AircraftCategory> {
    return this.http.put<AircraftCategory>(`/api/admin/aircraft-categories/${code}`, update);
  }

  createType(type: AircraftType): Observable<AircraftType> {
    return this.http.post<AircraftType>('/api/admin/aircraft-types', type);
  }

  updateType(icaoCode: string, type: AircraftType): Observable<AircraftType> {
    return this.http.put<AircraftType>(`/api/admin/aircraft-types/${encodeURIComponent(icaoCode)}`, type);
  }

  deleteType(icaoCode: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/aircraft-types/${encodeURIComponent(icaoCode)}`);
  }

  importAirports(): Observable<AirportCatalogImportResult> {
    return this.http.post<AirportCatalogImportResult>('/api/admin/airports/import', {});
  }
}