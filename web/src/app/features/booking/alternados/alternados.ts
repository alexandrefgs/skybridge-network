import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../../shared/header/header';
import { BookingService } from '../../../core/services/booking.service';
import { WeatherService } from '../../../core/services/weather.service';
import { Booking } from '../../../core/models/booking.models';

interface ClimaAeroporto {
  metar: string | null;
  taf: string | null;
  metarEncontrado: boolean;
  tafEncontrado: boolean;
}

@Component({
  selector: 'app-booking-alternados',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './alternados.html',
})
export class BookingAlternados implements OnInit {
  bookingId!: number;
  booking = signal<Booking | null>(null);
  carregando = signal(true);
  salvando = signal(false);
  erro = signal<string | null>(null);

  alternado1 = '';
  alternado2 = '';
  alternado3 = '';
  alternado4 = '';

  climas = signal<Record<string, ClimaAeroporto | 'carregando'>>({});

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private weatherService: WeatherService
  ) {}

  async ngOnInit(): Promise<void> {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const booking = await this.bookingService.obterDetalhe(this.bookingId);
      this.booking.set(booking);
    } catch {
      this.erro.set('Booking não encontrado.');
    } finally {
      this.carregando.set(false);
    }
  }

  async consultarClima(icao: string): Promise<void> {
    const codigo = icao.trim().toUpperCase();
    if (codigo.length !== 4) return;

    this.climas.update(atual => ({ ...atual, [codigo]: 'carregando' }));

    const [metar, taf] = await Promise.allSettled([
      this.weatherService.obterMetar(codigo),
      this.weatherService.obterTaf(codigo),
    ]);

    this.climas.update(atual => ({
      ...atual,
      [codigo]: {
        metar: metar.status === 'fulfilled' ? metar.value.raw : null,
        metarEncontrado: metar.status === 'fulfilled',
        taf: taf.status === 'fulfilled' ? taf.value.raw : null,
        tafEncontrado: taf.status === 'fulfilled',
      },
    }));
  }

  climaDe(icao: string): ClimaAeroporto | 'carregando' | null {
    const codigo = icao.trim().toUpperCase();
    return this.climas()[codigo] ?? null;
  }

  async continuar(): Promise<void> {
    this.erro.set(null);
    this.salvando.set(true);
    try {
      await this.bookingService.definirAlternados(
        this.bookingId,
        this.alternado1.trim().toUpperCase(),
        this.alternado2.trim().toUpperCase(),
        this.alternado3.trim().toUpperCase(),
        this.alternado4.trim().toUpperCase()
      );
      this.router.navigateByUrl(`/booking/${this.bookingId}/configurar`);
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível salvar os alternados.');
    } finally {
      this.salvando.set(false);
    }
  }
}