import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../../shared/header/header';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.models';

@Component({
  selector: 'app-booking-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, Header],
  templateUrl: './lista.html',
})
export class BookingLista implements OnInit {
  bookings = signal<Booking[]>([]);
  carregando = signal(true);
  excluindo = signal<number | null>(null);
  bookingParaExcluir = signal<Booking | null>(null);

  constructor(
    private auth: AuthService,
    private bookingService: BookingService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.piloto()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.bookings.set(await this.bookingService.listarMeus());
    this.carregando.set(false);
  }

  linkDoBooking(booking: Booking): string {
    if (booking.status === 'Rascunho') return `/booking/${booking.id}/perfil`;
    return `/booking/${booking.id}/briefing`;
  }

  corDoStatus(status: string): string {
    switch (status) {
      case 'Concluido': return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
      case 'EmVoo': return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
      case 'Cancelado': return 'text-red-300 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-300 bg-white/5 border-[var(--sb-border)]';
    }
  }

  pedirConfirmacao(evento: Event, booking: Booking): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.bookingParaExcluir.set(booking);
  }

  cancelarExclusao(): void {
    this.bookingParaExcluir.set(null);
  }

  async confirmarExclusao(): Promise<void> {
    const booking = this.bookingParaExcluir();
    if (!booking) return;

    this.excluindo.set(booking.id);
    this.bookingParaExcluir.set(null);
    try {
      await this.bookingService.excluir(booking.id);
      this.bookings.update(atual => atual.filter(b => b.id !== booking.id));
    } catch {
      alert('Não foi possível excluir a reserva.');
    } finally {
      this.excluindo.set(null);
    }
  }
}