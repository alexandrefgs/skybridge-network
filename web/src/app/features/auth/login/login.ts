import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})
export class Login {
  modo = signal<'login' | 'registro'>('login');
  carregando = signal(false);
  erro = signal<string | null>(null);

  nome = '';
  email = '';
  senha = '';

  constructor(private auth: AuthService, private router: Router) {}

  alternarModo(): void {
    this.modo.set(this.modo() === 'login' ? 'registro' : 'login');
    this.erro.set(null);
  }

  async enviar(): Promise<void> {
    this.erro.set(null);
    this.carregando.set(true);

    try {
      if (this.modo() === 'login') {
        await this.auth.login({ email: this.email, senha: this.senha });
      } else {
        await this.auth.registrar({ nome: this.nome, email: this.email, senha: this.senha });
      }
      this.router.navigateByUrl('/dashboard');
    } catch (erro: any) {
      const mensagens = erro?.error?.erros;
      this.erro.set(
        Array.isArray(mensagens) ? mensagens.join(' ') : erro?.error ?? 'Não foi possível concluir. Tente novamente.'
      );
    } finally {
      this.carregando.set(false);
    }
  }
}
