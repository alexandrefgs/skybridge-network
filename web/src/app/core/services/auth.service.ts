import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginPayload, PilotoResumo, RegistroPayload } from '../models/auth.models';

const CHAVE_AUTH = 'skybridge_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  piloto = signal<PilotoResumo | null>(null);
  ehAdmin = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    const salvo = this.obterAuthSalvo();
    if (salvo) {
      this.piloto.set(salvo.piloto);
      this.ehAdmin.set(this.extrairRole(salvo.token) === 'Admin');
    }
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const resposta = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/Auth/login`, payload)
    );
    this.salvarAuth(resposta);
    return resposta;
  }

  async registrar(payload: RegistroPayload): Promise<AuthResponse> {
    const resposta = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/Auth/registrar`, payload)
    );
    this.salvarAuth(resposta);
    return resposta;
  }

  async refresh(): Promise<AuthResponse | null> {
    const atual = this.obterAuthSalvo();
    if (!atual?.refreshToken) return null;

    try {
      const resposta = await firstValueFrom(
        this.http.post<AuthResponse>(`${environment.apiUrl}/Auth/refresh`, { refreshToken: atual.refreshToken })
      );
      this.salvarAuth(resposta);
      return resposta;
    } catch {
      this.logout();
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(CHAVE_AUTH);
    this.piloto.set(null);
    this.ehAdmin.set(false);
    this.router.navigateByUrl('/');
  }

  obterToken(): string | null {
    return this.obterAuthSalvo()?.token ?? null;
  }

  estaLogado(): boolean {
    return !!this.obterToken();
  }

  atualizarLocalizacaoLocal(icao: string): void {
    const atual = this.obterAuthSalvo();
    if (!atual) return;

    atual.piloto.localizacaoAtualIcao = icao;
    localStorage.setItem(CHAVE_AUTH, JSON.stringify(atual));
    this.piloto.set(atual.piloto);
  }

  private salvarAuth(resposta: AuthResponse): void {
    localStorage.setItem(CHAVE_AUTH, JSON.stringify(resposta));
    this.piloto.set(resposta.piloto);
    this.ehAdmin.set(this.extrairRole(resposta.token) === 'Admin');
  }

  private obterAuthSalvo(): AuthResponse | null {
    const bruto = localStorage.getItem(CHAVE_AUTH);
    return bruto ? JSON.parse(bruto) : null;
  }

  private extrairRole(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? payload['role'] ?? null;
    } catch {
      return null;
    }
  }
}