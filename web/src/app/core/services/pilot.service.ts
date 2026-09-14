import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PilotoDetalhe, PilotoResumo } from '../models/pilot.models';

@Injectable({ providedIn: 'root' })
export class PilotService {
  constructor(private http: HttpClient) {}

  listar(): Promise<PilotoResumo[]> {
    return firstValueFrom(this.http.get<PilotoResumo[]>(`${environment.apiUrl}/Pilots`));
  }

  obterDetalhe(id: number): Promise<PilotoDetalhe> {
    return firstValueFrom(this.http.get<PilotoDetalhe>(`${environment.apiUrl}/Pilots/${id}`));
  }

  definirLocalizacao(id: number, aeroportoIcao: string): Promise<string> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/Pilots/${id}/localizacao`, { aeroportoIcao }, { responseType: 'text' })
    );
  }

  inativar(id: number): Promise<string> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/Pilots/${id}/inativar`, {}, { responseType: 'text' })
    );
  }

  reativar(id: number): Promise<string> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/Pilots/${id}/reativar`, {}, { responseType: 'text' })
    );
  }

  excluir(id: number): Promise<string> {
    return firstValueFrom(
      this.http.delete(`${environment.apiUrl}/Pilots/${id}`, { responseType: 'text' })
    );
  }
}