import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NovoPirep, PirepResultado } from '../models/pirep.models';

@Injectable({ providedIn: 'root' })
export class PirepService {
  constructor(private http: HttpClient) {}

  enviar(dto: NovoPirep): Promise<PirepResultado> {
    return firstValueFrom(this.http.post<PirepResultado>(`${environment.apiUrl}/Pireps`, dto));
  }
}
