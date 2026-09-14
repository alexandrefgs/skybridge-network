import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../../shared/header/header';
import { AuthService } from '../../../core/services/auth.service';
import { AwardService } from '../../../core/services/award.service';
import { Award } from '../../../core/models/award.models';

@Component({
  selector: 'app-admin-awards',
  standalone: true,
  imports: [CommonModule, RouterLink, Header],
  templateUrl: './awards.html',
})
export class AdminAwards implements OnInit {
  awards = signal<Award[]>([]);
  carregando = signal(true);
  excluindo = signal<number | null>(null);
  awardParaExcluir = signal<Award | null>(null);
  mensagem = signal<{ texto: string; tipo: 'ok' | 'erro' } | null>(null);

  constructor(
    public auth: AuthService,
    private awardService: AwardService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.ehAdmin()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    await this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.awards.set(await this.awardService.listar());
    this.carregando.set(false);
  }

  editar(award: Award): void {
    this.router.navigateByUrl(`/admin/awards/${award.id}/editar`);
  }

  pedirConfirmacaoExclusao(award: Award): void {
    this.awardParaExcluir.set(award);
  }

  cancelarExclusao(): void {
    this.awardParaExcluir.set(null);
  }

  async confirmarExclusao(): Promise<void> {
    const award = this.awardParaExcluir();
    if (!award) return;

    this.excluindo.set(award.id);
    this.awardParaExcluir.set(null);
    this.mensagem.set(null);
    try {
      await this.awardService.excluir(award.id);
      this.mensagem.set({ texto: `Award "${award.nome}" excluída.`, tipo: 'ok' });
      await this.carregar();
    } catch (erro: any) {
      this.mensagem.set({ texto: erro?.error ?? 'Não foi possível excluir a award.', tipo: 'erro' });
    } finally {
      this.excluindo.set(null);
    }
  }
}