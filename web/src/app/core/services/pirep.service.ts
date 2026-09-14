import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NovoPirep, PirepDetalhe, PirepPendente, PirepResultado, TelemetriaLog, UltimoVoo } from '../models/pirep.models';

@Injectable({ providedIn: 'root' })
export class PirepService {
  constructor(private http: HttpClient) {}

  enviar(dto: NovoPirep): Promise<PirepResultado> {
    return firstValueFrom(this.http.post<PirepResultado>(`${environment.apiUrl}/Pireps`, dto));
  }

  listarUltimos(quantidade: number, pilotoId?: number): Promise<UltimoVoo[]> {
    let url = `${environment.apiUrl}/Pireps/ultimos?quantidade=${quantidade}`;
    if (pilotoId != null) url += `&pilotoId=${pilotoId}`;
    return firstValueFrom(this.http.get<UltimoVoo[]>(url));
  }

  listarPendentes(): Promise<PirepPendente[]> {
    return firstValueFrom(this.http.get<PirepPendente[]>(`${environment.apiUrl}/Pireps/pendentes`));
  }

  obterDetalhe(pirepId: number): Promise<PirepDetalhe> {
    return firstValueFrom(this.http.get<PirepDetalhe>(`${environment.apiUrl}/Pireps/${pirepId}`));
  }

  obterTelemetria(pirepId: number): Promise<TelemetriaLog[]> {
    return firstValueFrom(this.http.get<TelemetriaLog[]>(`${environment.apiUrl}/Pireps/${pirepId}/telemetria`));
  }

  aprovar(pirepId: number): Promise<string> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/Pireps/${pirepId}/aprovar`, {}, { responseType: 'text' })
    );
  }

  rejeitar(pirepId: number, motivo: string): Promise<string> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/Pireps/${pirepId}/rejeitar`, { motivo }, { responseType: 'text' })
    );
  }
}