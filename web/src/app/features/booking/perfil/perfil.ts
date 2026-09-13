import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.models';

@Component({
  selector: 'app-booking-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './perfil.html',
})
export class BookingPerfil implements OnInit {
  bookingId!: number;
  booking = signal<Booking | null>(null);
  carregando = signal(true);
  salvando = signal(false);
  erro = signal<string | null>(null);

  sugestoes = [
    'SimBrief Default',
    'FlyByWire (MSFS) - All Versions',
    'iniBuilds (MSFS)',
    'ToLiss (X-Plane)',
  ];

  perfilSelecionado = '';

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
      this.perfilSelecionado = booking.simBriefPerfilId ?? '';
    } catch {
      this.erro.set('Booking não encontrado.');
    } finally {
      this.carregando.set(false);
    }
  }

  async continuar(): Promise<void> {
    if (!this.perfilSelecionado.trim()) {
      this.erro.set('Selecione ou digite um perfil.');
      return;
    }

    this.erro.set(null);
    this.salvando.set(true);
    try {
      await this.bookingService.definirPerfilSimBrief(this.bookingId, this.perfilSelecionado.trim());
      this.router.navigateByUrl(`/booking/${this.bookingId}/alternados`);
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível salvar o perfil.');
    } finally {
      this.salvando.set(false);
    }
  }
}