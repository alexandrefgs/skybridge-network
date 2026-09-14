import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { PilotService } from '../../core/services/pilot.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './header.html',
})
export class Header implements OnInit, OnDestroy {
  bookingAtivoId = signal<number | null>(null);

  modalBaseAberto = signal(false);
  baseIcao = '';
  salvandoBase = signal(false);
  erroBase = signal<string | null>(null);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    public auth: AuthService,
    private bookingService: BookingService,
    private pilotService: PilotService
  ) {}

  ngOnInit(): void {
    const piloto = this.auth.piloto();
    if (!piloto) return;

    if (!piloto.localizacaoAtualIcao) {
      this.modalBaseAberto.set(true);
    }

    this.verificarBookingAtivo();
    this.intervalId = setInterval(() => this.verificarBookingAtivo(), 15000);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) clearInterval(this.intervalId);
  }

  private async verificarBookingAtivo(): Promise<void> {
    try {
      const bookings = await this.bookingService.listarMeus();
      const ativo = bookings.find(b => b.status === 'BriefingGerado' || b.status === 'EmVoo');
      this.bookingAtivoId.set(ativo ? ativo.id : null);
    } catch {
      // silencioso — próxima checagem em 15s
    }
  }

  async confirmarBase(): Promise<void> {
    const piloto = this.auth.piloto();
    if (!piloto) return;

    const icao = this.baseIcao.trim().toUpperCase();
    if (icao.length !== 4) {
      this.erroBase.set('Informe um código ICAO válido (4 letras).');
      return;
    }

    this.erroBase.set(null);
    this.salvandoBase.set(true);
    try {
      await this.pilotService.definirLocalizacao(piloto.id, icao);
      this.auth.atualizarLocalizacaoLocal(icao);
      this.modalBaseAberto.set(false);
    } catch (erro: any) {
      this.erroBase.set(erro?.error ?? 'Não foi possível salvar sua base.');
    } finally {
      this.salvandoBase.set(false);
    }
  }
}