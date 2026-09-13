import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Metar, Taf } from '../models/booking.models';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private http: HttpClient) {}

  obterMetar(icao: string): Promise<Metar> {
    return firstValueFrom(this.http.get<Metar>(`${environment.apiUrl}/Weather/metar/${icao}`));
  }

  obterTaf(icao: string): Promise<Taf> {
    return firstValueFrom(this.http.get<Taf>(`${environment.apiUrl}/Weather/taf/${icao}`));
  }
}