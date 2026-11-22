import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AircraftCategory, AircraftCategoryCode, AircraftType } from './aircraft.models';

@Injectable({ providedIn: 'root' })
export class AircraftService {
  private readonly http = inject(HttpClient);

  categories(): Observable<AircraftCategory[]> {
    return this.http.get<AircraftCategory[]>('/api/aircraft-categories');
  }

  types(category: AircraftCategoryCode | null, search: string): Observable<AircraftType[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (search) params = params.set('q', search);
    return this.http.get<AircraftType[]>('/api/aircraft-types', { params });
  }
}