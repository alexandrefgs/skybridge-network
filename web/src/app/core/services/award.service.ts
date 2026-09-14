import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Award, NovoAwardPayload } from '../models/award.models';

@Injectable({ providedIn: 'root' })
export class AwardService {
  constructor(private http: HttpClient) {}

  listar(): Promise<Award[]> {
    return firstValueFrom(this.http.get<Award[]>(`${environment.apiUrl}/Awards`));
  }

  obterDetalhe(id: number): Promise<Award> {
    return firstValueFrom(this.http.get<Award>(`${environment.apiUrl}/Awards/${id}`));
  }

  criar(dto: NovoAwardPayload): Promise<Award> {
    return firstValueFrom(this.http.post<Award>(`${environment.apiUrl}/Awards`, dto));
  }

  atualizar(id: number, dto: NovoAwardPayload): Promise<Award> {
    return firstValueFrom(this.http.put<Award>(`${environment.apiUrl}/Awards/${id}`, dto));
  }

  excluir(id: number): Promise<string> {
    return firstValueFrom(this.http.delete(`${environment.apiUrl}/Awards/${id}`, { responseType: 'text' }));
  }

  definirImagem(id: number, url: string): Promise<string> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/Awards/${id}/imagem`, { url }, { responseType: 'text' })
    );
  }
}