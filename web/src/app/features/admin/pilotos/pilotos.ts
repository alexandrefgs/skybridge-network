import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../../shared/header/header';
import { AuthService } from '../../../core/services/auth.service';
import { PilotService } from '../../../core/services/pilot.service';
import { PilotoResumo } from '../../../core/models/pilot.models';

@Component({
  selector: 'app-admin-pilotos',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './pilotos.html',
})
export class AdminPilotos implements OnInit {
  pilotos = signal<PilotoResumo[]>([]);
  carregando = signal(true);
  processando = signal<number | null>(null);
  mensagem = signal<{ texto: string; tipo: 'ok' | 'erro' } | null>(null);

  busca = signal('');
  paginaAtual = signal(1);
  itensPorPagina = 10;

  pilotoParaExcluir = signal<PilotoResumo | null>(null);

  pilotosFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) return this.pilotos();
    return this.pilotos().filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      p.callsign.toLowerCase().includes(termo) ||
      p.email.toLowerCase().includes(termo)
    );
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.pilotosFiltrados().length / this.itensPorPagina)));

  pilotosDaPagina = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina;
    return this.pilotosFiltrados().slice(inicio, inicio + this.itensPorPagina);
  });

  constructor(
    public auth: AuthService,
    private pilotService: PilotService,
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
    this.pilotos.set(await this.pilotService.listar());
    this.carregando.set(false);
  }

  aoBuscar(termo: string): void {
    this.busca.set(termo);
    this.paginaAtual.set(1);
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
  }

  async alternarAtivo(piloto: PilotoResumo): Promise<void> {
    this.processando.set(piloto.id);
    this.mensagem.set(null);
    try {
      if (piloto.ativo) {
        await this.pilotService.inativar(piloto.id);
        this.mensagem.set({ texto: `${piloto.callsign} inativado.`, tipo: 'ok' });
      } else {
        await this.pilotService.reativar(piloto.id);
        this.mensagem.set({ texto: `${piloto.callsign} reativado.`, tipo: 'ok' });
      }
      await this.carregar();
    } catch (erro: any) {
      this.mensagem.set({ texto: erro?.error ?? 'Não foi possível atualizar o piloto.', tipo: 'erro' });
    } finally {
      this.processando.set(null);
    }
  }

  pedirConfirmacaoExclusao(piloto: PilotoResumo): void {
    this.pilotoParaExcluir.set(piloto);
  }

  cancelarExclusao(): void {
    this.pilotoParaExcluir.set(null);
  }

  async confirmarExclusao(): Promise<void> {
    const piloto = this.pilotoParaExcluir();
    if (!piloto) return;

    this.processando.set(piloto.id);
    this.pilotoParaExcluir.set(null);
    try {
      await this.pilotService.excluir(piloto.id);
      this.mensagem.set({ texto: `${piloto.callsign} excluído.`, tipo: 'ok' });
      await this.carregar();
    } catch (erro: any) {
      this.mensagem.set({ texto: erro?.error ?? 'Não foi possível excluir o piloto.', tipo: 'erro' });
    } finally {
      this.processando.set(null);
    }
  }
}