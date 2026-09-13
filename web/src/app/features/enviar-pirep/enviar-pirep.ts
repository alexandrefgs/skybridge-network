import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AirlineService } from '../../core/services/airline.service';
import { PirepService } from '../../core/services/pirep.service';
import { AirlineDetalhe, FlightRoute } from '../../core/models/airline.models';
import { PirepResultado } from '../../core/models/pirep.models';

@Component({
  selector: 'app-enviar-pirep',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './enviar-pirep.html',
})
export class EnviarPirep implements OnInit {
  companhias = signal<AirlineDetalhe[]>([]);
  rotas = signal<FlightRoute[]>([]);
  carregando = signal(true);
  enviando = signal(false);
  erro = signal<string | null>(null);
  resultado = signal<PirepResultado | null>(null);

  companhiaSelecionadaId: number | null = null;
  flightRouteId: number | null = null;
  aircraftId: number | null = null;
  horasDeVoo: number | null = null;
  taxaDescidaTouchdownFpm: number | null = null;
  rede = 'Nenhuma';

  companhiaSelecionada = computed(() =>
    this.companhias().find(c => c.id === this.companhiaSelecionadaId) ?? null
  );

  constructor(
    public auth: AuthService,
    private airlineService: AirlineService,
    private pirepService: PirepService,
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

  async aoSelecionarCompanhia(): Promise<void> {
    this.flightRouteId = null;
    this.aircraftId = null;
    this.rotas.set([]);

    if (!this.companhiaSelecionadaId) return;
    this.rotas.set(await this.airlineService.listarRotas(this.companhiaSelecionadaId));
  }

  async enviar(): Promise<void> {
    this.erro.set(null);

    if (!this.flightRouteId || !this.aircraftId || this.horasDeVoo == null || this.taxaDescidaTouchdownFpm == null) {
      this.erro.set('Preencha todos os campos antes de enviar.');
      return;
    }

    this.enviando.set(true);

    try {
      const resultado = await this.pirepService.enviar({
        flightRouteId: this.flightRouteId,
        aircraftId: this.aircraftId,
        horasDeVoo: this.horasDeVoo,
        taxaDescidaTouchdownFpm: this.taxaDescidaTouchdownFpm,
        rede: this.rede,
      });
      this.resultado.set(resultado);
    } catch (erro: any) {
      const mensagens = erro?.error?.erros;
      this.erro.set(Array.isArray(mensagens) ? mensagens.join(' ') : erro?.error ?? 'Não foi possível enviar o PIREP.');
    } finally {
      this.enviando.set(false);
    }
  }

  novoPirep(): void {
    this.resultado.set(null);
    this.companhiaSelecionadaId = null;
    this.flightRouteId = null;
    this.aircraftId = null;
    this.horasDeVoo = null;
    this.taxaDescidaTouchdownFpm = null;
    this.rotas.set([]);
  }
}
