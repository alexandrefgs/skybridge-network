import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NovoTourPayload, Tour, TourProgresso } from '../models/tour.models';

@Injectable({ providedIn: 'root' })
export class TourService {
  constructor(private http: HttpClient) { }

  listar(): Promise<Tour[]> {
    return firstValueFrom(this.http.get<Tour[]>(`${environment.apiUrl}/Tours`));
  }

  obterDetalhe(id: number): Promise<Tour> {
    return firstValueFrom(this.http.get<Tour>(`${environment.apiUrl}/Tours/${id}`));
  }

  criar(dto: NovoTourPayload): Promise<Tour> {
    return firstValueFrom(this.http.post<Tour>(`${environment.apiUrl}/Tours`, dto));
  }

  definirFoto(id: number, url: string): Promise<string> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/Tours/${id}/foto`, { url }, { responseType: 'text' })
    );
  }

  definirFotoCapa(id: number, url: string): Promise<string> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/Tours/${id}/foto-capa`, { url }, { responseType: 'text' })
    );
  }

  atualizar(id: number, dto: NovoTourPayload): Promise<Tour> {
    return firstValueFrom(this.http.put<Tour>(`${environment.apiUrl}/Tours/${id}`, dto));
  }

  excluir(id: number): Promise<string> {
    return firstValueFrom(this.http.delete(`${environment.apiUrl}/Tours/${id}`, { responseType: 'text' }));
  }

    iniciar(tourId: number): Promise<string> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/Tours/${tourId}/iniciar`, {}, { responseType: 'text' })
    );
  }

  listarMeuProgresso(): Promise<TourProgresso[]> {
    return firstValueFrom(this.http.get<TourProgresso[]>(`${environment.apiUrl}/Tours/meu-progresso`));
  }
}