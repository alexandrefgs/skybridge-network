import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AirlineService } from '../../../core/services/airline.service';
import { BookingService } from '../../../core/services/booking.service';
import { Airline, AirlineDetalhe, FlightRoute } from '../../../core/models/airline.models';

@Component({
  selector: 'app-booking-nova',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './nova.html',
})
export class BookingNova implements OnInit {
  companhias = signal<AirlineDetalhe[]>([]);
  carregando = signal(true);
  salvando = signal(false);
  erro = signal<string | null>(null);

  airlineIdSelecionada: number | null = null;
  rotaIdSelecionada: number | null = null;
  aircraftIdSelecionado: number | null = null;
  callsign = '';
  dataVoo = '';
  horaPartida = '';
  horaChegada = '';

  constructor(
    private auth: AuthService,
    private airlineService: AirlineService,
    private bookingService: BookingService,
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

  rotasDaCompanhia = signal<FlightRoute[]>([]);

  async aoSelecionarCompanhia(): Promise<void> {
    this.rotaIdSelecionada = null;
    this.aircraftIdSelecionado = null;
    if (!this.airlineIdSelecionada) {
      this.rotasDaCompanhia.set([]);
      return;
    }
    const rotas = await this.airlineService.listarRotas(this.airlineIdSelecionada);
    this.rotasDaCompanhia.set(rotas);
  }

  async criar(): Promise<void> {
    if (!this.rotaIdSelecionada || !this.aircraftIdSelecionado || !this.dataVoo || !this.horaPartida || !this.horaChegada) {
      this.erro.set('Preencha todos os campos.');
      return;
    }

    this.erro.set(null);
    this.salvando.set(true);

    const [horaP, minP] = this.horaPartida.split(':').map(Number);
    const [horaC, minC] = this.horaChegada.split(':').map(Number);

    try {
      const booking = await this.bookingService.criar({
        flightRouteId: this.rotaIdSelecionada,
        aircraftId: this.aircraftIdSelecionado,
        callsign: this.callsign,
        dataVoo: this.dataVoo,
        horaPartidaUtc: horaP,
        minutoPartidaUtc: minP,
        horaChegadaUtc: horaC,
        minutoChegadaUtc: minC,
      });
      this.router.navigateByUrl(`/booking/${booking.id}/perfil`);
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível criar a reserva.');
    } finally {
      this.salvando.set(false);
    }
  }
}