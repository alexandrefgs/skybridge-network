import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AirlineService } from '../../core/services/airline.service';
import { AirlineDetalhe, FlightRoute } from '../../core/models/airline.models';

@Component({
  selector: 'app-companhias',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './companhias.html',
})
export class Companhias implements OnInit {
  companhias = signal<AirlineDetalhe[]>([]);
  carregando = signal(true);
  expandida = signal<number | null>(null);
  rotasPorCompanhia = signal<Record<number, FlightRoute[]>>({});
  carregandoRotas = signal<number | null>(null);
  mensagem = signal<string | null>(null);

  constructor(
    private airlineService: AirlineService,
    public auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.piloto()) {
      this.router.navigateByUrl('/login');
      return;
    }

    const lista = await this.airlineService.listar();
    const detalhes = await Promise.all(lista.map(a => this.airlineService.obterDetalhe(a.id)));
    this.companhias.set(detalhes);
    this.carregando.set(false);
  }

  async alternar(companhia: AirlineDetalhe): Promise<void> {
    if (this.expandida() === companhia.id) {
      this.expandida.set(null);
      return;
    }

    this.expandida.set(companhia.id);
    this.mensagem.set(null);

    if (!this.rotasPorCompanhia()[companhia.id]) {
      this.carregandoRotas.set(companhia.id);
      const rotas = await this.airlineService.listarRotas(companhia.id);
      this.rotasPorCompanhia.update(atual => ({ ...atual, [companhia.id]: rotas }));
      this.carregandoRotas.set(null);
    }
  }

  async iniciarCarreira(companhia: AirlineDetalhe): Promise<void> {
    const piloto = this.auth.piloto();
    if (!piloto) return;

    try {
      const resultado = await this.airlineService.iniciarCarreira(piloto.id, companhia.id);
      this.mensagem.set(resultado);
    } catch (erro: any) {
      this.mensagem.set(erro?.error ?? 'Não foi possível iniciar a carreira.');
    }
  }

  rotasDe(companhiaId: number): FlightRoute[] {
    return this.rotasPorCompanhia()[companhiaId] ?? [];
  }
}
