import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NovoPirep, PirepResultado, UltimoVoo } from '../models/pirep.models';

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
}