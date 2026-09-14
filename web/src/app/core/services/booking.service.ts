import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, NovoBookingPayload, StatusVoo, SimBriefRedirect } from '../models/booking.models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient) { }

  listarMeus(): Promise<Booking[]> {
    return firstValueFrom(this.http.get<Booking[]>(`${environment.apiUrl}/Bookings`));
  }

  obterDetalhe(id: number): Promise<Booking> {
    return firstValueFrom(this.http.get<Booking>(`${environment.apiUrl}/Bookings/${id}`));
  }

  criar(payload: NovoBookingPayload): Promise<Booking> {
    return firstValueFrom(this.http.post<Booking>(`${environment.apiUrl}/Bookings`, payload));
  }

  definirAlternados(id: number, a1: string, a2: string, a3: string, a4: string): Promise<string> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/Bookings/${id}/alternados`, {
        alternado1: a1 || null, alternado2: a2 || null, alternado3: a3 || null, alternado4: a4 || null,
      }, { responseType: 'text' })
    );
  }

  definirPerfilSimBrief(id: number, simBriefPerfilId: string): Promise<string> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/Bookings/${id}/perfil-simbrief`, { simBriefPerfilId }, { responseType: 'text' })
    );
  }

  definirPayload(id: number, payloadPassageiros: number | null, payloadCargaKg: number | null): Promise<string> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/Bookings/${id}/payload`, { payloadPassageiros, payloadCargaKg }, { responseType: 'text' })
    );
  }

  obterRedirectSimBrief(id: number): Promise<SimBriefRedirect> {
    return firstValueFrom(this.http.get<SimBriefRedirect>(`${environment.apiUrl}/Bookings/${id}/simbrief-redirect`));
  }

  confirmarOfp(id: number): Promise<Booking> {
    return firstValueFrom(this.http.post<Booking>(`${environment.apiUrl}/Bookings/${id}/confirmar-ofp`, {}));
  }

  iniciarVoo(id: number): Promise<string> {
    return firstValueFrom(this.http.post(`${environment.apiUrl}/Bookings/${id}/iniciar-voo`, {}, { responseType: 'text' }));
  }

  obterStatusVoo(id: number): Promise<StatusVoo> {
    return firstValueFrom(this.http.get<StatusVoo>(`${environment.apiUrl}/Bookings/${id}/status-voo`));
  }

  enviarPirep(id: number): Promise<any> {
    return firstValueFrom(this.http.post(`${environment.apiUrl}/Bookings/${id}/enviar-pirep`, {}));
  }

  excluir(id: number): Promise<string> {
    return firstValueFrom(this.http.delete(`${environment.apiUrl}/Bookings/${id}`, { responseType: 'text' }));
  }
}