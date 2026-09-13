import { Component, OnDestroy, OnInit, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { UltimoVoo, VooAtivo } from '../../core/models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  ultimosVoos = signal<UltimoVoo[]>([]);
  vooSelecionado = signal<UltimoVoo | null>(null);
  totalVoosAtivos = signal(0);
  carregando = signal(true);

  private mapa: L.Map | null = null;
  private marcadores = new Map<number, L.Marker>();
  private intervalo: ReturnType<typeof setInterval> | null = null;

  constructor(
    public auth: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.piloto()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.ultimosVoos.set(await this.dashboardService.listarUltimosVoos(10));
    this.carregando.set(false);
  }

  ngAfterViewInit(): void {
    this.iniciarMapa();
    this.atualizarVoosAtivos();
    this.intervalo = setInterval(() => this.atualizarVoosAtivos(), 5000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
    this.mapa?.remove();
  }

  verPirep(voo: UltimoVoo): void {
    this.vooSelecionado.set(voo);
  }

  fecharDetalhe(): void {
    this.vooSelecionado.set(null);
  }

  private iniciarMapa(): void {
    this.mapa = L.map('mapa-voos', {
      center: [10, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
      dragging: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.mapa);

    setTimeout(() => this.mapa?.invalidateSize(), 150);

    const container = this.mapa.getContainer();
    container.addEventListener('wheel', (evento: WheelEvent) => {
      if (evento.ctrlKey) {
        evento.preventDefault();
        this.mapa!.scrollWheelZoom.enable();
      } else {
        this.mapa!.scrollWheelZoom.disable();
      }
    }, { passive: false });
  }

  private async atualizarVoosAtivos(): Promise<void> {
    const ativos = await this.dashboardService.listarVoosAtivos();
    this.totalVoosAtivos.set(ativos.length);

    if (!this.mapa) return;

    const idsAtuais = new Set(ativos.map(v => v.pilotId));

    for (const [pilotId, marcador] of this.marcadores.entries()) {
      if (!idsAtuais.has(pilotId)) {
        marcador.remove();
        this.marcadores.delete(pilotId);
      }
    }

    for (const voo of ativos) {
      const icone = this.criarIconeAviao(voo.heading);
      const existente = this.marcadores.get(voo.pilotId);

      if (existente) {
        existente.setLatLng([voo.latitude, voo.longitude]);
        existente.setIcon(icone);
      } else {
        const marcador = L.marker([voo.latitude, voo.longitude], { icon: icone }).addTo(this.mapa);
        marcador.bindPopup(this.popupVoo(voo));
        this.marcadores.set(voo.pilotId, marcador);
      }
    }
  }

  private criarIconeAviao(heading: number): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `<div style="transform: rotate(${heading}deg); font-size: 20px; filter: drop-shadow(0 0 4px #22d3ee);">✈️</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  private popupVoo(voo: VooAtivo): string {
    return `<div style="font-family: monospace; font-size: 12px;">
      <strong>${voo.callsign}</strong><br/>
      Alt: ${Math.round(voo.altitudePes)} ft<br/>
      Vel: ${Math.round(voo.velocidadeNos)} kt
    </div>`;
  }
}
