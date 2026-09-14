import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../../shared/header/header';
import { AuthService } from '../../../core/services/auth.service';
import { AirlineService } from '../../../core/services/airline.service';
import { BookingService } from '../../../core/services/booking.service';
import { PilotService } from '../../../core/services/pilot.service';
import { Airline, AirlineDetalhe, FlightRoute, Aeronave } from '../../../core/models/airline.models';

@Component({
  selector: 'app-booking-nova',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './nova.html',
})
export class BookingNova implements OnInit {
  companhias = signal<AirlineDetalhe[]>([]);
  carregando = signal(true);
  salvando = signal(false);
  erro = signal<string | null>(null);

  jumpseatIcaoNecessario = signal<string | null>(null);
  fazendoJumpseat = signal(false);

  airlineIdSelecionada: number | null = null;
  rotaIdSelecionada: number | null = null;
  aircraftIdSelecionado: number | null = null;
  callsign = '';

  companhiaDropdownAberto = signal(false);
  buscaCompanhia = signal('');

  rotaDropdownAberto = signal(false);
  aeronaveDropdownAberto = signal(false);

  companhiasFiltradas = computed(() => {
    const termo = this.buscaCompanhia().trim().toLowerCase();
    if (!termo) return this.companhias();
    return this.companhias().filter(c =>
      c.nome.toLowerCase().includes(termo) || c.icao.toLowerCase().includes(termo)
    );
  });

  constructor(
    private auth: AuthService,
    private airlineService: AirlineService,
    private bookingService: BookingService,
    private pilotService: PilotService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.piloto()) {
      this.router.navigateByUrl('/login');
      return;
    }

    const lista = await this.airlineService.listar();
    const detalhes = await Promise.all(lista.map((a: Airline) => this.airlineService.obterDetalhe(a.id)));
    this.companhias.set(detalhes);
    this.carregando.set(false);
  }

  get companhiaSelecionada(): AirlineDetalhe | undefined {
    return this.companhias().find(c => c.id === this.airlineIdSelecionada);
  }

  get rotaSelecionada(): FlightRoute | undefined {
    return this.rotasDaCompanhia().find(r => r.id === this.rotaIdSelecionada);
  }

  get aeronaveSelecionada(): Aeronave | undefined {
    return this.companhiaSelecionada?.frota.find(a => a.id === this.aircraftIdSelecionado);
  }

  rotasDaCompanhia = signal<FlightRoute[]>([]);

  alternarCompanhiaDropdown(): void {
    this.companhiaDropdownAberto.set(!this.companhiaDropdownAberto());
    if (!this.companhiaDropdownAberto()) this.buscaCompanhia.set('');
  }

  alternarRotaDropdown(): void {
    this.rotaDropdownAberto.set(!this.rotaDropdownAberto());
  }

  selecionarRota(rota: FlightRoute): void {
    this.rotaIdSelecionada = rota.id;
    this.rotaDropdownAberto.set(false);
  }

  alternarAeronaveDropdown(): void {
    this.aeronaveDropdownAberto.set(!this.aeronaveDropdownAberto());
  }

  selecionarAeronave(aeronave: Aeronave): void {
    this.aircraftIdSelecionado = aeronave.id;
    this.aeronaveDropdownAberto.set(false);
  }

  async selecionarCompanhia(companhia: AirlineDetalhe): Promise<void> {
    this.airlineIdSelecionada = companhia.id;
    this.companhiaDropdownAberto.set(false);
    this.buscaCompanhia.set('');
    await this.aoSelecionarCompanhia();
  }

  async aoSelecionarCompanhia(): Promise<void> {
    this.rotaIdSelecionada = null;
    this.aircraftIdSelecionado = null;
    this.jumpseatIcaoNecessario.set(null);
    this.erro.set(null);
    if (!this.airlineIdSelecionada) {
      this.rotasDaCompanhia.set([]);
      return;
    }
    const rotas = await this.airlineService.listarRotas(this.airlineIdSelecionada);
    this.rotasDaCompanhia.set(rotas);
  }

  async criar(): Promise<void> {
    if (!this.rotaIdSelecionada || !this.aircraftIdSelecionado || !this.callsign.trim()) {
      this.erro.set('Preencha todos os campos.');
      return;
    }

    this.erro.set(null);
    this.jumpseatIcaoNecessario.set(null);
    this.salvando.set(true);

    const agora = new Date();
    const dataVoo = agora.toISOString().slice(0, 10);
    const horaPartidaUtc = agora.getUTCHours();
    const minutoPartidaUtc = agora.getUTCMinutes();
    const chegadaEstimativa = new Date(agora.getTime() + 60 * 60 * 1000);
    const horaChegadaUtc = chegadaEstimativa.getUTCHours();
    const minutoChegadaUtc = chegadaEstimativa.getUTCMinutes();

    try {
      const booking = await this.bookingService.criar({
        flightRouteId: this.rotaIdSelecionada,
        aircraftId: this.aircraftIdSelecionado,
        callsign: this.callsign,
        dataVoo,
        horaPartidaUtc,
        minutoPartidaUtc,
        horaChegadaUtc,
        minutoChegadaUtc,
      });
      this.router.navigateByUrl(`/booking/${booking.id}/perfil`);
    } catch (erro: any) {
      const mensagem: string = erro?.error ?? '';
      if (mensagem.startsWith('JUMPSEAT_NECESSARIO:')) {
        this.jumpseatIcaoNecessario.set(mensagem.split(':')[1]);
      } else {
        this.erro.set(mensagem || 'Não foi possível criar a reserva.');
      }
    } finally {
      this.salvando.set(false);
    }
  }

  async fazerJumpseat(): Promise<void> {
    const icao = this.jumpseatIcaoNecessario();
    const piloto = this.auth.piloto();
    if (!icao || !piloto) return;

    this.fazendoJumpseat.set(true);
    try {
      await this.pilotService.definirLocalizacao(piloto.id, icao);
      this.auth.atualizarLocalizacaoLocal(icao);
      this.jumpseatIcaoNecessario.set(null);
      await this.criar();
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível fazer o Jumpseat.');
    } finally {
      this.fazendoJumpseat.set(false);
    }
  }
}