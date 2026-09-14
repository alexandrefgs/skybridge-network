import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResultado {
  url: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  constructor(private http: HttpClient) {}

  uploadImagem(arquivo: File): Promise<UploadResultado> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return firstValueFrom(this.http.post<UploadResultado>(`${environment.apiUrl}/Uploads/imagem`, formData));
  }
}