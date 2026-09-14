import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Airline, AirlineDetalhe, FlightRoute } from '../models/airline.models';
import { NovaAeronave, NovaAirline, NovaRota } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AirlineService {
  constructor(private http: HttpClient) {}

  listar(): Promise<Airline[]> {
    return firstValueFrom(this.http.get<Airline[]>(`${environment.apiUrl}/Airlines`));
  }

  obterDetalhe(id: number): Promise<AirlineDetalhe> {
    return firstValueFrom(this.http.get<AirlineDetalhe>(`${environment.apiUrl}/Airlines/${id}`));
  }

  listarRotas(airlineId: number): Promise<FlightRoute[]> {
    return firstValueFrom(this.http.get<FlightRoute[]>(`${environment.apiUrl}/Airlines/${airlineId}/rotas`));
  }

  iniciarCarreira(pilotId: number, airlineId: number): Promise<string> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/Pilots/${pilotId}/carreiras/${airlineId}`, null, { responseType: 'text' })
    );
  }

  criarCompanhia(dto: NovaAirline): Promise<Airline> {
    return firstValueFrom(this.http.post<Airline>(`${environment.apiUrl}/Airlines`, dto));
  }

  atualizarCompanhia(id: number, dto: NovaAirline): Promise<Airline> {
    return firstValueFrom(this.http.put<Airline>(`${environment.apiUrl}/Airlines/${id}`, dto));
  }

  excluirCompanhia(id: number): Promise<string> {
    return firstValueFrom(this.http.delete(`${environment.apiUrl}/Airlines/${id}`, { responseType: 'text' }));
  }

  adicionarAeronave(airlineId: number, dto: NovaAeronave): Promise<any> {
    return firstValueFrom(this.http.post(`${environment.apiUrl}/Airlines/${airlineId}/aeronaves`, dto));
  }

  adicionarRota(airlineId: number, dto: NovaRota): Promise<any> {
    return firstValueFrom(this.http.post(`${environment.apiUrl}/Airlines/${airlineId}/rotas`, dto));
  }

  atualizarRota(airlineId: number, routeId: number, dto: NovaRota): Promise<FlightRoute> {
    return firstValueFrom(this.http.put<FlightRoute>(`${environment.apiUrl}/Airlines/${airlineId}/rotas/${routeId}`, dto));
  }

  excluirRota(airlineId: number, routeId: number): Promise<string> {
    return firstValueFrom(
      this.http.delete(`${environment.apiUrl}/Airlines/${airlineId}/rotas/${routeId}`, { responseType: 'text' })
    );
  }
}