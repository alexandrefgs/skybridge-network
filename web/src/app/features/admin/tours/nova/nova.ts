import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../../../shared/header/header';
import { AuthService } from '../../../../core/services/auth.service';
import { AirlineService } from '../../../../core/services/airline.service';
import { AwardService } from '../../../../core/services/award.service';
import { TourService } from '../../../../core/services/tour.service';
import { UploadService } from '../../../../core/services/upload.service';
import { Airline, FlightRoute } from '../../../../core/models/airline.models';
import { Award } from '../../../../core/models/award.models';
import { NovoTourPayload } from '../../../../core/models/tour.models';

interface EtapaForm {
  airlineId: number | null;
  routeId: number | null;
  rotasDisponiveis: FlightRoute[];
  carregandoRotas: boolean;
}

@Component({
  selector: 'app-admin-tour-nova',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './nova.html',
})
export class AdminTourNova implements OnInit {
  companhias = signal<Airline[]>([]);
  awards = signal<Award[]>([]);
  carregando = signal(true);
  salvando = signal(false);
  erro = signal<string | null>(null);

  tourId: number | null = null;
  modoEdicao = false;

  nome = '';
  descricao = '';
  pontosBonusConclusao = 0;
  awardId: number | null = null;

  fotoAtualUrl: string | null = null;
  fotoCapaAtualUrl: string | null = null;
  fotoFile: File | null = null;
  fotoCapaFile: File | null = null;
  fotoPreview = signal<string | null>(null);
  fotoCapaPreview = signal<string | null>(null);

  etapas = signal<EtapaForm[]>([]);

  constructor(
    public auth: AuthService,
    private airlineService: AirlineService,
    private awardService: AwardService,
    private tourService: TourService,
    private uploadService: UploadService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.ehAdmin()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    this.modoEdicao = idParam !== null;
    this.tourId = idParam !== null ? Number(idParam) : null;

    const [companhias, awards] = await Promise.all([
      this.airlineService.listar(),
      this.awardService.listar(),
    ]);

    this.companhias.set(companhias);
    this.awards.set(awards);

    if (this.modoEdicao && this.tourId !== null) {
      await this.carregarTourExistente(this.tourId);
    } else {
      this.adicionarEtapa();
    }

    this.carregando.set(false);
  }

  private async carregarTourExistente(id: number): Promise<void> {
    try {
      const tour = await this.tourService.obterDetalhe(id);

      this.nome = tour.nome;
      this.descricao = tour.descricao ?? '';
      this.pontosBonusConclusao = tour.pontosBonusConclusao;
      this.awardId = this.awards().some(a => a.nome === tour.awardNome) 
        ? this.awards().find(a => a.nome === tour.awardNome)!.id 
        : null;
      this.fotoAtualUrl = tour.fotoUrl;
      this.fotoCapaAtualUrl = tour.fotoCapaUrl;

      const etapasCarregadas: EtapaForm[] = [];
      for (const etapa of tour.etapas) {
        const rotas = await this.airlineService.listarRotas(etapa.airlineId);
        etapasCarregadas.push({
          airlineId: etapa.airlineId,
          routeId: etapa.flightRouteId,
          rotasDisponiveis: rotas,
          carregandoRotas: false,
        });
      }
      this.etapas.set(etapasCarregadas);
    } catch {
      this.erro.set('Tour não encontrado.');
    }
  }

  adicionarEtapa(): void {
    this.etapas.update(lista => [
      ...lista,
      { airlineId: null, routeId: null, rotasDisponiveis: [], carregandoRotas: false },
    ]);
  }

  removerEtapa(index: number): void {
    this.etapas.update(lista => lista.filter((_, i) => i !== index));
  }

  moverEtapa(index: number, direcao: -1 | 1): void {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= this.etapas().length) return;

    this.etapas.update(lista => {
      const copia = [...lista];
      [copia[index], copia[novoIndex]] = [copia[novoIndex], copia[index]];
      return copia;
    });
  }

  async aoSelecionarCompanhia(index: number, airlineId: number | null): Promise<void> {
    this.etapas.update(lista => {
      const copia = [...lista];
      copia[index] = { ...copia[index], airlineId, routeId: null, rotasDisponiveis: [], carregandoRotas: airlineId !== null };
      return copia;
    });

    if (airlineId === null) return;

    const rotas = await this.airlineService.listarRotas(airlineId);

    this.etapas.update(lista => {
      const copia = [...lista];
      if (copia[index].airlineId === airlineId) {
        copia[index] = { ...copia[index], rotasDisponiveis: rotas, carregandoRotas: false };
      }
      return copia;
    });
  }

  aoSelecionarRota(index: number, routeId: number | null): void {
    this.etapas.update(lista => {
      const copia = [...lista];
      copia[index] = { ...copia[index], routeId };
      return copia;
    });
  }

  aoSelecionarFoto(event: Event): void {
    const arquivo = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.fotoFile = arquivo;
    this.fotoPreview.set(arquivo ? URL.createObjectURL(arquivo) : null);
  }

  aoSelecionarFotoCapa(event: Event): void {
    const arquivo = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.fotoCapaFile = arquivo;
    this.fotoCapaPreview.set(arquivo ? URL.createObjectURL(arquivo) : null);
  }

  podeSalvar(): boolean {
    if (!this.nome.trim()) return false;
    if (this.etapas().length === 0) return false;
    return this.etapas().every(e => e.airlineId !== null && e.routeId !== null);
  }

  async salvar(): Promise<void> {
    if (!this.podeSalvar()) return;

    this.erro.set(null);
    this.salvando.set(true);

    const payload: NovoTourPayload = {
      nome: this.nome.trim(),
      descricao: this.descricao.trim() || null,
      pontosBonusConclusao: this.pontosBonusConclusao,
      awardId: this.awardId,
      etapas: this.etapas().map((e, i) => ({ flightRouteId: e.routeId!, ordem: i + 1 })),
    };

    try {
      const tour = this.modoEdicao && this.tourId !== null
        ? await this.tourService.atualizar(this.tourId, payload)
        : await this.tourService.criar(payload);

      if (this.fotoFile) {
        const resultado = await this.uploadService.uploadImagem(this.fotoFile);
        await this.tourService.definirFoto(tour.id, resultado.url);
      }

      if (this.fotoCapaFile) {
        const resultado = await this.uploadService.uploadImagem(this.fotoCapaFile);
        await this.tourService.definirFotoCapa(tour.id, resultado.url);
      }

      this.router.navigateByUrl('/admin/tours');
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível salvar o tour.');
    } finally {
      this.salvando.set(false);
    }
  }

  cancelar(): void {
    this.router.navigateByUrl('/admin/tours');
  }
}