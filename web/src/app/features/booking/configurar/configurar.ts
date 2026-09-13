import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.models';

@Component({
  selector: 'app-booking-configurar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './configurar.html',
})
export class BookingConfigurar implements OnInit {
  bookingId!: number;
  booking = signal<Booking | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);
  mensagem = signal<string | null>(null);

  payloadPassageiros: number | null = null;
  payloadCargaKg: number | null = null;
  salvandoPayload = signal(false);

  gerandoRedirect = signal(false);
  confirmando = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService
  ) {}

  async ngOnInit(): Promise<void> {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));
    await this.recarregar();
  }

  async recarregar(): Promise<void> {
    try {
      const booking = await this.bookingService.obterDetalhe(this.bookingId);
      this.booking.set(booking);
      this.payloadPassageiros = booking.payloadPassageiros;
      this.payloadCargaKg = booking.payloadCargaKg;
    } catch {
      this.erro.set('Booking não encontrado.');
    } finally {
      this.carregando.set(false);
    }
  }

  async salvarPayload(): Promise<void> {
    this.erro.set(null);
    this.salvandoPayload.set(true);
    try {
      await this.bookingService.definirPayload(this.bookingId, this.payloadPassageiros, this.payloadCargaKg);
      this.mensagem.set('Payload salvo.');
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível salvar o payload.');
    } finally {
      this.salvandoPayload.set(false);
    }
  }

  async gerarNoSimBrief(): Promise<void> {
    this.erro.set(null);
    this.gerandoRedirect.set(true);
    try {
      const redirect = await this.bookingService.obterRedirectSimBrief(this.bookingId);
      window.open(redirect.url, '_blank');
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível gerar o link do SimBrief.');
    } finally {
      this.gerandoRedirect.set(false);
    }
  }

  async confirmarOfp(): Promise<void> {
    this.erro.set(null);
    this.mensagem.set(null);
    this.confirmando.set(true);
    try {
      const booking = await this.bookingService.confirmarOfp(this.bookingId);
      this.booking.set(booking);
      this.router.navigateByUrl(`/booking/${this.bookingId}/briefing`);
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível confirmar o OFP. Verifique se você já gerou o plano no SimBrief.');
    } finally {
      this.confirmando.set(false);
    }
  }
}