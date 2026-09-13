import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, StatusVoo } from '../../../core/models/booking.models';

@Component({
  selector: 'app-booking-briefing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './briefing.html',
})
export class BookingBriefing implements OnInit, OnDestroy {
  bookingId!: number;
  booking = signal<Booking | null>(null);
  statusVoo = signal<StatusVoo | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  iniciando = signal(false);
  enviandoPirep = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService
  ) {}

  async ngOnInit(): Promise<void> {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const booking = await this.bookingService.obterDetalhe(this.bookingId);
      this.booking.set(booking);

      if (booking.status === 'EmVoo') {
        this.iniciarPolling();
      }
    } catch {
      this.erro.set('Booking não encontrado.');
    } finally {
      this.carregando.set(false);
    }
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }

  private iniciarPolling(): void {
    this.pararPolling();
    this.consultarStatus();
    this.intervalId = setInterval(() => this.consultarStatus(), 10000);
  }

  private pararPolling(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async consultarStatus(): Promise<void> {
    try {
      const status = await this.bookingService.obterStatusVoo(this.bookingId);
      this.statusVoo.set(status);

      if (status.status !== 'EmVoo') {
        this.pararPolling();
        const booking = await this.bookingService.obterDetalhe(this.bookingId);
        this.booking.set(booking);
      }
    } catch {
      // silencioso — próxima tentativa em 10s
    }
  }

  async iniciarVoo(): Promise<void> {
    this.erro.set(null);
    this.iniciando.set(true);
    try {
      await this.bookingService.iniciarVoo(this.bookingId);
      const booking = await this.bookingService.obterDetalhe(this.bookingId);
      this.booking.set(booking);
      this.iniciarPolling();
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível iniciar o voo.');
    } finally {
      this.iniciando.set(false);
    }
  }

  async enviarPirep(): Promise<void> {
    this.erro.set(null);
    this.enviandoPirep.set(true);
    try {
      await this.bookingService.enviarPirep(this.bookingId);
      const booking = await this.bookingService.obterDetalhe(this.bookingId);
      this.booking.set(booking);
      this.pararPolling();
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível enviar o PIREP.');
    } finally {
      this.enviandoPirep.set(false);
    }
  }
}