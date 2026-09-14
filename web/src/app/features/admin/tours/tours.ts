import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../../shared/header/header';
import { AuthService } from '../../../core/services/auth.service';
import { TourService } from '../../../core/services/tour.service';
import { Tour } from '../../../core/models/tour.models';

@Component({
  selector: 'app-admin-tours',
  standalone: true,
  imports: [CommonModule, RouterLink, Header],
  templateUrl: './tours.html',
})
export class AdminTours implements OnInit {
  tours = signal<Tour[]>([]);
  carregando = signal(true);
  excluindo = signal<number | null>(null);
  tourParaExcluir = signal<Tour | null>(null);
  mensagem = signal<{ texto: string; tipo: 'ok' | 'erro' } | null>(null);

  constructor(
    public auth: AuthService,
    private tourService: TourService,
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
    this.tours.set(await this.tourService.listar());
    this.carregando.set(false);
  }

  editar(tour: Tour): void {
    this.router.navigateByUrl(`/admin/tours/${tour.id}/editar`);
  }

  pedirConfirmacaoExclusao(tour: Tour): void {
    this.tourParaExcluir.set(tour);
  }

  cancelarExclusao(): void {
    this.tourParaExcluir.set(null);
  }

  async confirmarExclusao(): Promise<void> {
    const tour = this.tourParaExcluir();
    if (!tour) return;

    this.excluindo.set(tour.id);
    this.tourParaExcluir.set(null);
    this.mensagem.set(null);
    try {
      await this.tourService.excluir(tour.id);
      this.mensagem.set({ texto: `Tour "${tour.nome}" excluído.`, tipo: 'ok' });
      await this.carregar();
    } catch (erro: any) {
      this.mensagem.set({ texto: erro?.error ?? 'Não foi possível excluir o tour.', tipo: 'erro' });
    } finally {
      this.excluindo.set(null);
    }
  }
}