import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { Header } from '../../../../shared/header/header';
import { AuthService } from '../../../../core/services/auth.service';
import { PirepService } from '../../../../core/services/pirep.service';
import { PirepDetalhe, TelemetriaLog } from '../../../../core/models/pirep.models';
import { gerarEventosDoVoo, EventoVoo } from '../../../../core/utils/processar-telemetria';
import { categorizarAeronave, tamanhoIconePorCategoria, svgAeronavePorCategoria } from '../../../../core/data/categoria-aeronave';

@Component({
  selector: 'app-admin-pirep-detalhe',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './detalhe.html',
})
export class AdminPirepDetalhe implements OnInit, OnDestroy {
  pirepId!: number;
  pirep = signal<PirepDetalhe | null>(null);
  logs = signal<TelemetriaLog[]>([]);
  eventos = signal<EventoVoo[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  processando = signal(false);

  modalRejeicaoAberto = signal(false);
  motivoRejeicao = signal('');

  private mapa: L.Map | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
    private pirepService: PirepService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.ehAdmin()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    this.pirepId = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const pirep = await this.pirepService.obterDetalhe(this.pirepId);
      this.pirep.set(pirep);

      let logs: TelemetriaLog[] = [];
      try {
        logs = await this.pirepService.obterTelemetria(this.pirepId);
      } catch {
        logs = [];
      }

      this.logs.set(logs);
      this.eventos.set(gerarEventosDoVoo(logs));
      this.carregando.set(false);

      if (logs.length > 0) {
        setTimeout(() => this.iniciarMapa(), 50);
      }
    } catch {
      this.erro.set('PIREP não encontrado.');
      this.carregando.set(false);
    }
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  private iniciarMapa(): void {
    const elemento = document.getElementById('mapa-pirep-detalhe');
    if (!elemento) {
      setTimeout(() => this.iniciarMapa(), 100);
      return;
    }

    this.mapa = L.map('mapa-pirep-detalhe', {
      center: [0, 0],
      zoom: 3,
      zoomControl: true,
      attributionControl: true,
      dragging: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.mapa);

    const container = this.mapa.getContainer();
    container.addEventListener('wheel', (evento: WheelEvent) => {
      if (evento.ctrlKey) {
        evento.preventDefault();
        this.mapa!.scrollWheelZoom.enable();
      } else {
        this.mapa!.scrollWheelZoom.disable();
      }
    }, { passive: false });

    const logs = this.logs();
    const pontos: L.LatLngExpression[] = logs.map(l => [l.latitude, l.longitude]);

    if (pontos.length > 0) {
      L.polyline(pontos, { color: '#67e8f9', weight: 3, opacity: 0.9 }).addTo(this.mapa);

      const primeiro = logs[0];
      const ultimo = logs[logs.length - 1];
      const categoria = categorizarAeronave(this.pirep()?.aeronaveCodigoIcao ?? '');
      const tamanho = tamanhoIconePorCategoria(categoria);

      const iconeInicio = this.criarIconePin('#22d3ee', 'Início');
      L.marker(pontos[0], { icon: iconeInicio }).addTo(this.mapa);

      const svgFim = svgAeronavePorCategoria(categoria, '#f59e0b');
      const iconeFim = L.divIcon({
        className: '',
        html: `<div style="width:${tamanho}px; height:${tamanho}px; transform: rotate(${ultimo.heading}deg); filter: drop-shadow(0 0 3px #f59e0b);">${svgFim}</div>`,
        iconSize: [tamanho + 4, tamanho + 4],
        iconAnchor: [(tamanho + 4) / 2, (tamanho + 4) / 2],
      });
      L.marker(pontos[pontos.length - 1], { icon: iconeFim }).addTo(this.mapa);

      this.mapa.fitBounds(L.latLngBounds(pontos), { padding: [40, 40] });
    }

    setTimeout(() => this.mapa?.invalidateSize(), 150);
  }

  private criarIconePin(cor: string, rotulo: string): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="22" height="30" viewBox="0 0 22 30" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 0C4.9 0 0 4.9 0 11c0 8.25 11 19 11 19s11-10.75 11-19c0-6.1-4.9-11-11-11z" fill="${cor}"/>
            <circle cx="11" cy="11" r="4.5" fill="#0a0a0f"/>
          </svg>
          <span style="background:#0a0a0f; color:${cor}; font-size:9px; font-weight:bold; font-family:monospace; padding:1px 5px; border-radius:4px; margin-top:2px; border:1px solid ${cor};">${rotulo}</span>
        </div>`,
      iconSize: [22, 46],
      iconAnchor: [11, 30],
    });
  }

  voltar(): void {
    this.router.navigateByUrl('/admin/pireps');
  }

  async aprovar(): Promise<void> {
    this.processando.set(true);
    this.erro.set(null);
    try {
      await this.pirepService.aprovar(this.pirepId);
      this.router.navigateByUrl('/admin/pireps');
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível aprovar o PIREP.');
    } finally {
      this.processando.set(false);
    }
  }

  pedirRejeicao(): void {
    this.motivoRejeicao.set('');
    this.modalRejeicaoAberto.set(true);
  }

  cancelarRejeicao(): void {
    this.modalRejeicaoAberto.set(false);
  }

  async confirmarRejeicao(): Promise<void> {
    if (!this.motivoRejeicao().trim()) return;

    this.processando.set(true);
    this.modalRejeicaoAberto.set(false);
    try {
      await this.pirepService.rejeitar(this.pirepId, this.motivoRejeicao().trim());
      this.router.navigateByUrl('/admin/pireps');
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível rejeitar o PIREP.');
    } finally {
      this.processando.set(false);
    }
  }
}