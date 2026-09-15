import { Component, OnDestroy, OnInit, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { Header } from '../../shared/header/header';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { WeatherService } from '../../core/services/weather.service';
import { PilotService } from '../../core/services/pilot.service';
import { TourService } from '../../core/services/tour.service';
import { EstatisticasService } from '../../core/services/estatisticas.service';
import { UltimoVoo, VooAtivo } from '../../core/models/dashboard.models';
import { PilotoDetalhe } from '../../core/models/pilot.models';
import { Tour, TourProgresso } from '../../core/models/tour.models';
import { EstatisticasRede } from '../../core/models/estatisticas.models';
import { categorizarAeronave, tamanhoIconePorCategoria, svgAeronavePorCategoria } from '../../core/data/categoria-aeronave';
import { AirportService } from '../../core/services/airport.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Header],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  ultimosVoos = signal<UltimoVoo[]>([]);
  totalVoosAtivos = signal(0);
  carregando = signal(true);

  meuPiloto = signal<PilotoDetalhe | null>(null);
  estatisticas = signal<EstatisticasRede | null>(null);
  tours = signal<Tour[]>([]);
  meuProgresso = signal<TourProgresso[]>([]);
  iniciandoTour = signal<number | null>(null);

  private mapa: L.Map | null = null;
  private marcadores = new Map<number, L.Marker>();
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private linhaRotaAtiva: L.Polyline | null = null;
  private pinsRotaAtiva: L.Marker[] = [];

  constructor(
    public auth: AuthService,
    private dashboardService: DashboardService,
    private weatherService: WeatherService,
    private pilotService: PilotService,
    private tourService: TourService,
    private estatisticasService: EstatisticasService,
    private airportService: AirportService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    const logado = this.auth.piloto();
    if (!logado) {
      this.router.navigateByUrl('/login');
      return;
    }

    const [ultimosVoos, meuPiloto, estatisticas, tours, progresso] = await Promise.all([
      this.dashboardService.listarUltimosVoos(10),
      this.pilotService.obterDetalhe(logado.id),
      this.estatisticasService.obter(),
      this.tourService.listar(),
      this.tourService.listarMeuProgresso(),
    ]);

    this.ultimosVoos.set(ultimosVoos);
    this.meuPiloto.set(meuPiloto);
    this.estatisticas.set(estatisticas);
    this.tours.set(tours);
    this.meuProgresso.set(progresso);
    this.carregando.set(false);

    setTimeout(() => this.iniciarMapa(), 50);
    this.atualizarVoosAtivos();
    this.intervalo = setInterval(() => this.atualizarVoosAtivos(), 5000);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
    this.mapa?.remove();
  }

  estrelas(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? 1 : 0));
  }

  progressoDoTour(tourId: number): TourProgresso | null {
    return this.meuProgresso().find(p => p.tourId === tourId) ?? null;
  }

  async iniciarTour(tour: Tour): Promise<void> {
    this.iniciandoTour.set(tour.id);
    try {
      await this.tourService.iniciar(tour.id);
      this.meuProgresso.set(await this.tourService.listarMeuProgresso());
    } catch {
      // silencioso — botão volta ao normal
    } finally {
      this.iniciandoTour.set(null);
    }
  }

  verVoo(voo: UltimoVoo): void {
    this.router.navigateByUrl(`/perfil/voo/${voo.pirepId}`);
  }

  private iniciarMapa(): void {
    const elemento = document.getElementById('mapa-voos');
    if (!elemento) {
      setTimeout(() => this.iniciarMapa(), 100);
      return;
    }

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
      const icone = this.criarIconeAviao(voo.heading, voo.aeronaveCodigoIcao);
      const existente = this.marcadores.get(voo.pilotId);

      if (existente) {
        existente.setLatLng([voo.latitude, voo.longitude]);
        existente.setIcon(icone);
        existente.setPopupContent(this.popupVoo(voo));
      } else {
        const marcador = L.marker([voo.latitude, voo.longitude], { icon: icone }).addTo(this.mapa);
        marcador.bindPopup(this.popupVoo(voo));
        marcador.on('click', () => this.plotarRota(voo));
        this.marcadores.set(voo.pilotId, marcador);
      }
    }
  }

  private async obterCoordenadas(icao: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const aeroporto = await this.airportService.obterPorIcao(icao);
      return { latitude: aeroporto.latitude, longitude: aeroporto.longitude };
    } catch {
      try {
        const metar = await this.weatherService.obterMetar(icao);
        if (metar.latitude == null || metar.longitude == null) return null;
        return { latitude: metar.latitude, longitude: metar.longitude };
      } catch {
        return null;
      }
    }
  }

  private async plotarRota(voo: VooAtivo): Promise<void> {
    if (!this.mapa || !voo.aeroportoOrigem || !voo.aeroportoDestino) return;

    this.limparRotaAtiva();

    try {
      const origem = await this.obterCoordenadas(voo.aeroportoOrigem);
      const destino = await this.obterCoordenadas(voo.aeroportoDestino);

      if (!origem || !destino) return;

      const pontoOrigem: L.LatLngExpression = [origem.latitude, origem.longitude];
      const pontoDestino: L.LatLngExpression = [destino.latitude, destino.longitude];

      const icone = (icao: string, cor: string) => L.divIcon({
        className: '',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center;">
            <svg width="22" height="30" viewBox="0 0 22 30" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 0C4.9 0 0 4.9 0 11c0 8.25 11 19 11 19s11-10.75 11-19c0-6.1-4.9-11-11-11z" fill="${cor}"/>
              <circle cx="11" cy="11" r="4.5" fill="#0a0a0f"/>
            </svg>
            <span style="background:#0a0a0f; color:${cor}; font-size:9px; font-weight:bold; font-family:monospace; padding:1px 5px; border-radius:4px; margin-top:2px; border:1px solid ${cor};">${icao}</span>
          </div>`,
        iconSize: [22, 46],
        iconAnchor: [11, 30],
      });

      this.pinsRotaAtiva.push(
        L.marker(pontoOrigem, { icon: icone(voo.aeroportoOrigem, '#22d3ee') }).addTo(this.mapa!),
        L.marker(pontoDestino, { icon: icone(voo.aeroportoDestino, '#22d3ee') }).addTo(this.mapa!)
      );

      this.linhaRotaAtiva = L.polyline([pontoOrigem, pontoDestino], {
        color: '#22d3ee',
        weight: 2,
        opacity: 0.7,
        dashArray: '6, 6',
      }).addTo(this.mapa!);
    } catch {
      // METAR indisponível para algum dos aeroportos — não plota a linha
    }
  }

  private limparRotaAtiva(): void {
    this.linhaRotaAtiva?.remove();
    this.linhaRotaAtiva = null;
    this.pinsRotaAtiva.forEach(p => p.remove());
    this.pinsRotaAtiva = [];
  }

  private criarIconeAviao(heading: number, codigoIcao?: string | null): L.DivIcon {
    const categoria = categorizarAeronave(codigoIcao);
    const tamanho = tamanhoIconePorCategoria(categoria);
    const svg = svgAeronavePorCategoria(categoria, '#22d3ee');
    return L.divIcon({
      className: '',
      html: `<div style="width:${tamanho}px; height:${tamanho}px; transform: rotate(${heading}deg); filter: drop-shadow(0 0 3px #22d3ee);">${svg}</div>`,
      iconSize: [tamanho + 4, tamanho + 4],
      iconAnchor: [(tamanho + 4) / 2, (tamanho + 4) / 2],
    });
  }

  private popupVoo(voo: VooAtivo): string {
    const rota = voo.aeroportoOrigem && voo.aeroportoDestino
      ? `${voo.aeroportoOrigem} → ${voo.aeroportoDestino}<br/>`
      : '';
    const aeronave = voo.aeronaveModelo ? `${voo.aeronaveModelo}<br/>` : '';
    return `<div style="font-family: monospace; font-size: 12px;">
      <strong>${voo.callsign}</strong><br/>
      ${aeronave}${rota}
      Alt: ${Math.round(voo.altitudePes)} ft<br/>
      Vel: ${Math.round(voo.velocidadeNos)} kt
    </div>`;
  }
}