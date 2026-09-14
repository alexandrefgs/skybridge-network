import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../../shared/header/header';
import { AuthService } from '../../../core/services/auth.service';
import { PirepService } from '../../../core/services/pirep.service';
import { PirepPendente } from '../../../core/models/pirep.models';

@Component({
  selector: 'app-admin-pireps',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './pireps.html',
})
export class AdminPireps implements OnInit {
  pendentes = signal<PirepPendente[]>([]);
  carregando = signal(true);
  processando = signal<number | null>(null);
  mensagem = signal<{ texto: string; tipo: 'ok' | 'erro' } | null>(null);

  pirepParaRejeitar = signal<PirepPendente | null>(null);
  motivoRejeicao = signal('');

  constructor(
    public auth: AuthService,
    private pirepService: PirepService,
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
    this.pendentes.set(await this.pirepService.listarPendentes());
    this.carregando.set(false);
  }

  abrirDetalhe(pirep: PirepPendente): void {
    this.router.navigateByUrl(`/admin/pireps/${pirep.id}`);
  }

  async aprovar(pirep: PirepPendente): Promise<void> {
    this.processando.set(pirep.id);
    this.mensagem.set(null);
    try {
      await this.pirepService.aprovar(pirep.id);
      this.mensagem.set({ texto: `PIREP #${pirep.id} (${pirep.pilotCallsign}) aprovado.`, tipo: 'ok' });
      await this.carregar();
    } catch (erro: any) {
      this.mensagem.set({ texto: erro?.error ?? 'Não foi possível aprovar o PIREP.', tipo: 'erro' });
    } finally {
      this.processando.set(null);
    }
  }

  pedirRejeicao(pirep: PirepPendente): void {
    this.pirepParaRejeitar.set(pirep);
    this.motivoRejeicao.set('');
  }

  cancelarRejeicao(): void {
    this.pirepParaRejeitar.set(null);
  }

  async confirmarRejeicao(): Promise<void> {
    const pirep = this.pirepParaRejeitar();
    if (!pirep || !this.motivoRejeicao().trim()) return;

    this.processando.set(pirep.id);
    this.pirepParaRejeitar.set(null);
    try {
      await this.pirepService.rejeitar(pirep.id, this.motivoRejeicao().trim());
      this.mensagem.set({ texto: `PIREP #${pirep.id} (${pirep.pilotCallsign}) rejeitado.`, tipo: 'ok' });
      await this.carregar();
    } catch (erro: any) {
      this.mensagem.set({ texto: erro?.error ?? 'Não foi possível rejeitar o PIREP.', tipo: 'erro' });
    } finally {
      this.processando.set(null);
    }
  }
}