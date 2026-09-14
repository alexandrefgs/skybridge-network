import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Award } from '../models/award.models';

@Injectable({ providedIn: 'root' })
export class AwardService {
  constructor(private http: HttpClient) {}

  listar(): Promise<Award[]> {
    return firstValueFrom(this.http.get<Award[]>(`${environment.apiUrl}/Awards`));
  }
}