import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UltimoVoo, VooAtivo } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  listarVoosAtivos(): Promise<VooAtivo[]> {
    return firstValueFrom(this.http.get<VooAtivo[]>(`${environment.apiUrl}/VoosAtivos`));
  }

  listarUltimosVoos(quantidade = 10): Promise<UltimoVoo[]> {
    return firstValueFrom(
      this.http.get<UltimoVoo[]>(`${environment.apiUrl}/Pireps/ultimos`, { params: { quantidade } })
    );
  }
}
