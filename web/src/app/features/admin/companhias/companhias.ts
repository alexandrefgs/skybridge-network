import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AirlineService } from '../../../core/services/airline.service';
import { Airline } from '../../../core/models/airline.models';

@Component({
  selector: 'app-admin-companhias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './companhias.html',
})
export class AdminCompanhias implements OnInit {
  aba = signal<'companhia' | 'aeronave' | 'rota'>('companhia');
  companhias = signal<Airline[]>([]);
  carregando = signal(true);
  salvando = signal(false);
  mensagem = signal<string | null>(null);
  erro = signal<string | null>(null);

  tiposOperacao = ['Nacional', 'Regional', 'Internacional', 'Executivo', 'Cargueiro'];

  novaCompanhia = { nome: '', iata: '', icao: '', pais: '', callsignPadrao: '' };
  companhiaSelecionadaId: number | null = null;
  novaAeronave = { modelo: '', codigoIcao: '', matricula: '', tiposOperacaoSuportados: [] as string[] };
  novaRota = { aeroportoOrigem: '', aeroportoDestino: '', distanciaMilhas: 0, numeroVoo: '', tipoOperacao: 'Nacional', ratingMinimo: 0 };

  constructor(
    public auth: AuthService,
    private airlineService: AirlineService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const piloto = this.auth.piloto();
    if (!piloto) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.companhias.set(await this.airlineService.listar());
    this.carregando.set(false);
  }

  alternarTipoOperacao(tipo: string): void {
    const lista = this.novaAeronave.tiposOperacaoSuportados;
    const indice = lista.indexOf(tipo);
    if (indice === -1) lista.push(tipo);
    else lista.splice(indice, 1);
  }

  async salvarCompanhia(): Promise<void> {
    this.mensagem.set(null);
    this.erro.set(null);
    this.salvando.set(true);

    try {
      const criada = await this.airlineService.criarCompanhia(this.novaCompanhia);
      this.mensagem.set(`Companhia "${criada.nome}" criada com sucesso.`);
      this.companhias.set(await this.airlineService.listar());
      this.novaCompanhia = { nome: '', iata: '', icao: '', pais: '', callsignPadrao: '' };
    } catch (erro: any) {
      this.tratarErro(erro);
    } finally {
      this.salvando.set(false);
    }
  }

  async salvarAeronave(): Promise<void> {
    this.mensagem.set(null);
    this.erro.set(null);

    if (!this.companhiaSelecionadaId) {
      this.erro.set('Selecione uma companhia.');
      return;
    }

    this.salvando.set(true);

    try {
      await this.airlineService.adicionarAeronave(this.companhiaSelecionadaId, this.novaAeronave);
      this.mensagem.set('Aeronave adicionada com sucesso.');
      this.novaAeronave = { modelo: '', codigoIcao: '', matricula: '', tiposOperacaoSuportados: [] };
    } catch (erro: any) {
      this.tratarErro(erro);
    } finally {
      this.salvando.set(false);
    }
  }

  async salvarRota(): Promise<void> {
    this.mensagem.set(null);
    this.erro.set(null);

    if (!this.companhiaSelecionadaId) {
      this.erro.set('Selecione uma companhia.');
      return;
    }

    this.salvando.set(true);

    try {
      await this.airlineService.adicionarRota(this.companhiaSelecionadaId, this.novaRota);
      this.mensagem.set('Rota adicionada com sucesso.');
      this.novaRota = { aeroportoOrigem: '', aeroportoDestino: '', distanciaMilhas: 0, numeroVoo: '', tipoOperacao: 'Nacional', ratingMinimo: 0 };
    } catch (erro: any) {
      this.tratarErro(erro);
    } finally {
      this.salvando.set(false);
    }
  }

  private tratarErro(erro: any): void {
    const mensagens = erro?.error?.erros;
    this.erro.set(Array.isArray(mensagens) ? mensagens.join(' ') : erro?.error ?? 'Não foi possível salvar.');
  }
}
