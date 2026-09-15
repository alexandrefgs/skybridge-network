import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { Header } from '../../../shared/header/header';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { WeatherService } from '../../../core/services/weather.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Booking, StatusVoo } from '../../../core/models/booking.models';
import { categorizarAeronave, tamanhoIconePorCategoria, svgAeronavePorCategoria } from '../../../core/data/categoria-aeronave';
import { AirportService } from '../../../core/services/airport.service';

@Component({
  selector: 'app-booking-briefing',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './briefing.html',
  styleUrl: './briefing.css',
})
export class BookingBriefing implements OnInit, OnDestroy {
  bookingId!: number;
  booking = signal<Booking | null>(null);
  statusVoo = signal<StatusVoo | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  iniciando = signal(false);
  enviandoPirep = signal(false);

  excluindo = signal(false);
  modalExclusaoAberto = signal(false);

  cancelando = signal(false);
  modalCancelamentoAberto = signal(false);

  podeIniciarVoo = signal(false);
  motivoBloqueio = signal<string | null>(null);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private intervaloMapa: ReturnType<typeof setInterval> | null = null;
  private intervaloVerificacao: ReturnType<typeof setInterval> | null = null;
  private mapa: L.Map | null = null;
  private marcadorAviao: L.Marker | null = null;
  private trilhaAviao: L.LatLngExpression[] = [];
  private linhaTrilha: L.Polyline | null = null;
  private mapaCentralizadoNoAviao = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private bookingService: BookingService,
    private weatherService: WeatherService,
    private dashboardService: DashboardService,
    private airportService: AirportService
  ) {}

  async ngOnInit(): Promise<void> {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const booking = await this.bookingService.obterDetalhe(this.bookingId);
      this.booking.set(booking);
      this.carregando.set(false);

      setTimeout(() => this.iniciarMapa(), 50);

      if (booking.status === 'EmVoo') {
        this.iniciarPolling();
      }

      if (booking.status === 'BriefingGerado') {
        this.verificarProntoParaIniciar();
        this.intervaloVerificacao = setInterval(() => this.verificarProntoParaIniciar(), 5000);
      }
    } catch {
      this.erro.set('Booking não encontrado.');
      this.carregando.set(false);
    }
  }

  ngOnDestroy(): void {
    this.pararPolling();
    if (this.intervaloMapa !== null) clearInterval(this.intervaloMapa);
    if (this.intervaloVerificacao !== null) clearInterval(this.intervaloVerificacao);
    this.mapa?.remove();
  }

  private async verificarProntoParaIniciar(): Promise<void> {
    const booking = this.booking();
    const piloto = this.auth.piloto();
    if (!booking || !piloto) {
      this.podeIniciarVoo.set(false);
      return;
    }

    try {
      const ativos = await this.dashboardService.listarVoosAtivos();
      const meuVoo = ativos.find(v => v.pilotId === piloto.id);

      if (!meuVoo) {
        this.podeIniciarVoo.set(false);
        this.motivoBloqueio.set('Conecte o ACARS e deixe-o enviando telemetria para iniciar o voo.');
        return;
      }

      const segundosDesdeUltimaTelemetria = (Date.now() - new Date(meuVoo.atualizadoEm).getTime()) / 1000;
      if (segundosDesdeUltimaTelemetria > 30) {
        this.podeIniciarVoo.set(false);
        this.motivoBloqueio.set('ACARS sem telemetria recente. Verifique a conexão.');
        return;
      }

      const coordenadasOrigem = await this.obterCoordenadas(booking.aeroportoOrigem);
      if (!coordenadasOrigem) {
        this.podeIniciarVoo.set(false);
        this.motivoBloqueio.set('Não foi possível verificar a posição do aeroporto de partida.');
        return;
      }

      const distanciaNm = this.calcularDistanciaNm(meuVoo.latitude, meuVoo.longitude, coordenadasOrigem.latitude, coordenadasOrigem.longitude);
      if (distanciaNm > 5) {
        this.podeIniciarVoo.set(false);
        this.motivoBloqueio.set(`Aeronave a ${distanciaNm.toFixed(1)} nm de ${booking.aeroportoOrigem}. Posicione-se no aeroporto de partida.`);
        return;
      }

      this.podeIniciarVoo.set(true);
      this.motivoBloqueio.set(null);
    } catch {
      this.podeIniciarVoo.set(false);
      this.motivoBloqueio.set('Não foi possível verificar sua posição.');
    }
  }

  private calcularDistanciaNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const raioNm = 3440.065;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return raioNm * c;
  }

  private async iniciarMapa(): Promise<void> {
    const booking = this.booking();
    if (!booking) return;

    const elemento = document.getElementById('mapa-briefing');
    if (!elemento) {
      setTimeout(() => this.iniciarMapa(), 100);
      return;
    }

    this.mapa = L.map('mapa-briefing', {
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

    const pontos: L.LatLngExpression[] = [];

    const origem = await this.plotarPin(booking.aeroportoOrigem, 'Origem', '#22d3ee');
    const destino = await this.plotarPin(booking.aeroportoDestino, 'Destino', '#22d3ee');
    if (origem) pontos.push(origem);
    if (destino) pontos.push(destino);

    if (origem && destino) {
      L.polyline([origem, destino], {
        color: '#22d3ee',
        weight: 2,
        opacity: 0.7,
        dashArray: '6, 6',
      }).addTo(this.mapa);
    }

    if (booking.alternado1) {
      const alternado = await this.plotarPin(booking.alternado1, 'Alternado', '#f59e0b');
      if (alternado) pontos.push(alternado);
    }

    if (pontos.length > 0) {
      this.mapa.fitBounds(L.latLngBounds(pontos), { padding: [40, 40] });
    }

    setTimeout(() => this.mapa?.invalidateSize(), 150);

    if (booking.status === 'EmVoo') {
      this.atualizarPosicaoAviao();
      this.intervaloMapa = setInterval(() => this.atualizarPosicaoAviao(), 5000);
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

  private async plotarPin(icao: string, rotulo: string, cor: string): Promise<L.LatLngExpression | null> {
    try {
      const coordenadas = await this.obterCoordenadas(icao);
      if (!coordenadas) return null;

      const icone = L.divIcon({
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

      const posicao: L.LatLngExpression = [coordenadas.latitude, coordenadas.longitude];

      L.marker(posicao, { icon: icone })
        .bindPopup(`<strong>${rotulo}</strong><br/>${icao}`)
        .addTo(this.mapa!);

      return posicao;
    } catch {
      return null;
    }
  }

  private async atualizarPosicaoAviao(): Promise<void> {
    const piloto = this.auth.piloto();
    if (!piloto || !this.mapa) return;

    const ativos = await this.dashboardService.listarVoosAtivos();
    const meuVoo = ativos.find(v => v.pilotId === piloto.id);
    if (!meuVoo) return;

    const posicao: L.LatLngExpression = [meuVoo.latitude, meuVoo.longitude];

    this.trilhaAviao.push(posicao);
    if (this.linhaTrilha) {
      this.linhaTrilha.setLatLngs(this.trilhaAviao);
    } else {
      this.linhaTrilha = L.polyline(this.trilhaAviao, {
        color: '#67e8f9',
        weight: 3,
        opacity: 0.9,
      }).addTo(this.mapa);
    }

    const categoria = categorizarAeronave(meuVoo.aeronaveCodigoIcao);
    const tamanho = tamanhoIconePorCategoria(categoria);
    const svg = svgAeronavePorCategoria(categoria, '#22d3ee');
    const icone = L.divIcon({
      className: '',
      html: `<div style="width:${tamanho}px; height:${tamanho}px; transform: rotate(${meuVoo.heading}deg); filter: drop-shadow(0 0 3px #22d3ee);">${svg}</div>`,
      iconSize: [tamanho + 4, tamanho + 4],
      iconAnchor: [(tamanho + 4) / 2, (tamanho + 4) / 2],
    });

    if (this.marcadorAviao) {
      this.marcadorAviao.setLatLng(posicao);
      this.marcadorAviao.setIcon(icone);
      this.mapa.panTo(posicao, { animate: true });
    } else {
      this.marcadorAviao = L.marker(posicao, { icon: icone }).addTo(this.mapa);
    }

    if (!this.mapaCentralizadoNoAviao) {
      this.mapaCentralizadoNoAviao = true;
      this.mapa.setView(posicao, 8, { animate: true });
    }
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
    if (!this.podeIniciarVoo()) return;

    this.erro.set(null);
    this.iniciando.set(true);
    try {
      await this.bookingService.iniciarVoo(this.bookingId);
      const booking = await this.bookingService.obterDetalhe(this.bookingId);
      this.booking.set(booking);
      this.iniciarPolling();

      if (this.intervaloVerificacao !== null) {
        clearInterval(this.intervaloVerificacao);
        this.intervaloVerificacao = null;
      }

      if (!this.intervaloMapa) {
        this.atualizarPosicaoAviao();
        this.intervaloMapa = setInterval(() => this.atualizarPosicaoAviao(), 5000);
      }
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível iniciar o voo.');
    } finally {
      this.iniciando.set(false);
    }
  }

  async enviarPirep(): Promise<void> {
    if (!this.statusVoo()?.prontoParaPirep) return;

    this.erro.set(null);
    this.enviandoPirep.set(true);
    try {
      await this.bookingService.enviarPirep(this.bookingId);
      const booking = await this.bookingService.obterDetalhe(this.bookingId);
      this.booking.set(booking);
      this.pararPolling();
      if (this.intervaloMapa !== null) {
        clearInterval(this.intervaloMapa);
        this.intervaloMapa = null;
      }
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível enviar o PIREP.');
    } finally {
      this.enviandoPirep.set(false);
    }
  }

  pedirConfirmacaoExclusao(): void {
    this.modalExclusaoAberto.set(true);
  }

  cancelarExclusao(): void {
    this.modalExclusaoAberto.set(false);
  }

  async confirmarExclusao(): Promise<void> {
    this.excluindo.set(true);
    this.modalExclusaoAberto.set(false);
    try {
      await this.bookingService.excluir(this.bookingId);
      this.router.navigateByUrl('/booking');
    } catch {
      this.erro.set('Não foi possível excluir a reserva.');
      this.excluindo.set(false);
    }
  }

  pedirConfirmacaoCancelamento(): void {
    this.modalCancelamentoAberto.set(true);
  }

  fecharModalCancelamento(): void {
    this.modalCancelamentoAberto.set(false);
  }

  async confirmarCancelamento(): Promise<void> {
    this.modalCancelamentoAberto.set(false);
    this.erro.set(null);
    this.cancelando.set(true);
    try {
      await this.bookingService.cancelarVoo(this.bookingId);
      const booking = await this.bookingService.obterDetalhe(this.bookingId);
      this.booking.set(booking);
      this.pararPolling();
      if (this.intervaloMapa !== null) {
        clearInterval(this.intervaloMapa);
        this.intervaloMapa = null;
      }
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível cancelar o voo.');
    } finally {
      this.cancelando.set(false);
    }
  }

  enviarParaVatsim(): void {
    alert('Integração com a VATSIM em breve.');
  }

  enviarParaIvao(): void {
    alert('Integração com a IVAO em breve.');
  }
}