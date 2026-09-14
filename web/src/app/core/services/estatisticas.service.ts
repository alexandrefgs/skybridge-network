import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstatisticasRede } from '../models/estatisticas.models';

@Injectable({ providedIn: 'root' })
export class EstatisticasService {
  constructor(private http: HttpClient) {}

  obter(): Promise<EstatisticasRede> {
    return firstValueFrom(this.http.get<EstatisticasRede>(`${environment.apiUrl}/Estatisticas`));
  }
}