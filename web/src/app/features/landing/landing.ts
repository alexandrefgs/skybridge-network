import { Component, OnInit, OnDestroy, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { AirlineService } from '../../core/services/airline.service';
import { PilotService } from '../../core/services/pilot.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { Airline } from '../../core/models/airline.models';
import { UltimoVoo, VooAtivo } from '../../core/models/dashboard.models';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit, AfterViewInit, OnDestroy {
  companhias = signal<Airline[]>([]);
  totalPilotos = signal(0);
  ultimosVoos = signal<UltimoVoo[]>([]);
  totalVoosAtivos = signal(0);
  carregando = signal(true);
  mostrarBotaoTopo = signal(false);

  private mapa: L.Map | null = null;
  private marcadores = new Map<number, L.Marker>();
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private aoRolar = () => this.mostrarBotaoTopo.set(window.scrollY > 400);

  constructor(
    private airlineService: AirlineService,
    private pilotService: PilotService,
    private dashboardService: DashboardService,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.auth.piloto()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    const [companhias, pilotos, voos] = await Promise.all([
      this.airlineService.listar(),
      this.pilotService.listar(),
      this.dashboardService.listarUltimosVoos(5),
    ]);

    this.companhias.set(companhias);
    this.totalPilotos.set(pilotos.length);
    this.ultimosVoos.set(voos);
    this.carregando.set(false);
  }

  ngAfterViewInit(): void {
    if (this.auth.piloto()) return;

    this.iniciarMapa();
    this.atualizarVoosAtivos();
    this.intervalo = setInterval(() => this.atualizarVoosAtivos(), 5000);

    window.addEventListener('scroll', this.aoRolar);
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
    this.mapa?.remove();
    window.removeEventListener('scroll', this.aoRolar);
  }

  voltarAoTopo(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private iniciarMapa(): void {
    this.mapa = L.map('mapa-landing', {
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
      html: `<div style="transform: rotate(${heading}deg); font-size: 18px; filter: drop-shadow(0 0 4px #22d3ee);">✈️</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
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
