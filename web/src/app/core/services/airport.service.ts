import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Airport, NovoAirportPayload } from '../models/airport.models';

@Injectable({ providedIn: 'root' })
export class AirportService {
  constructor(private http: HttpClient) {}

  listar(): Promise<Airport[]> {
    return firstValueFrom(this.http.get<Airport[]>(`${environment.apiUrl}/Airports`));
  }

  obterPorIcao(icao: string): Promise<Airport> {
    return firstValueFrom(this.http.get<Airport>(`${environment.apiUrl}/Airports/${icao}`));
  }

  criar(dto: NovoAirportPayload): Promise<Airport> {
    return firstValueFrom(this.http.post<Airport>(`${environment.apiUrl}/Airports`, dto));
  }
}