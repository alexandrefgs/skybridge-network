import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AirlineService } from '../../../core/services/airline.service';
import { Airline } from '../../../core/models/airline.models';
import { NovaAirline, NovaAeronave, NovaRota } from '../../../core/models/admin.models';

type Feedback = { texto: string; tipo: 'ok' | 'erro' } | null;
type ResultadoImportacao = { total: number; sucesso: number; erros: string[] };

@Component({
  selector: 'app-admin-companhias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './companhias.html',
})
export class AdminCompanhias implements OnInit {
  companhias = signal<Airline[]>([]);
  carregando = signal(true);

  tiposOperacao = ['Executivo', 'Regional', 'Internacional', 'Cargueiro'];

  novaCompanhia: NovaAirline = { nome: '', iata: '', icao: '', pais: '', callsignPadrao: '' };
  salvandoCompanhia = signal(false);
  mensagemCompanhia = signal<Feedback>(null);

  airlineIdParaAeronave: number | null = null;
  novaAeronave: NovaAeronave = { modelo: '', codigoIcao: '', matricula: '', tiposOperacaoSuportados: [] };
  salvandoAeronave = signal(false);
  mensagemAeronave = signal<Feedback>(null);

  airlineIdParaRota: number | null = null;
  novaRota: NovaRota = { aeroportoOrigem: '', aeroportoDestino: '', distanciaMilhas: 0, numeroVoo: '', tipoOperacao: '', ratingMinimo: 0 };
  salvandoRota = signal(false);
  mensagemRota = signal<Feedback>(null);

  importandoCompanhias = signal(false);
  resultadoImportCompanhias = signal<ResultadoImportacao | null>(null);

  importandoAeronaves = signal(false);
  resultadoImportAeronaves = signal<ResultadoImportacao | null>(null);

  importandoRotas = signal(false);
  resultadoImportRotas = signal<ResultadoImportacao | null>(null);

  constructor(
    public auth: AuthService,
    private airlineService: AirlineService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.ehAdmin()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    await this.carregarCompanhias();
  }

  async carregarCompanhias(): Promise<void> {
    this.carregando.set(true);
    this.companhias.set(await this.airlineService.listar());
    this.carregando.set(false);
  }

  aeronaveTemTipo(tipo: string): boolean {
    return this.novaAeronave.tiposOperacaoSuportados.includes(tipo);
  }

  alternarTipoAeronave(tipo: string): void {
    const atual = this.novaAeronave.tiposOperacaoSuportados;
    this.novaAeronave.tiposOperacaoSuportados = atual.includes(tipo)
      ? atual.filter(t => t !== tipo)
      : [...atual, tipo];
  }

  private extrairMensagemErro(erro: any): string {
    const corpo = erro?.error;
    if (!corpo) return '';
    if (typeof corpo === 'string') return corpo;
    if (typeof corpo === 'object') {
      const partes: string[] = [];
      if (corpo.title) partes.push(corpo.title);
      if (corpo.errors) {
        Object.values(corpo.errors).forEach((mensagens: any) => {
          if (Array.isArray(mensagens)) partes.push(...mensagens);
        });
      }
      return partes.length > 0 ? partes.join(' ') : JSON.stringify(corpo);
    }
    return String(corpo);
  }

  async cadastrarCompanhia(): Promise<void> {
    this.mensagemCompanhia.set(null);
    this.salvandoCompanhia.set(true);
    try {
      await this.airlineService.criarCompanhia(this.novaCompanhia);
      this.mensagemCompanhia.set({ texto: 'Companhia cadastrada com sucesso.', tipo: 'ok' });
      this.novaCompanhia = { nome: '', iata: '', icao: '', pais: '', callsignPadrao: '' };
      await this.carregarCompanhias();
    } catch (erro: any) {
      this.mensagemCompanhia.set({ texto: this.extrairMensagemErro(erro) || 'Não foi possível cadastrar a companhia.', tipo: 'erro' });
    } finally {
      this.salvandoCompanhia.set(false);
    }
  }

  async cadastrarAeronave(): Promise<void> {
    if (!this.airlineIdParaAeronave) {
      this.mensagemAeronave.set({ texto: 'Selecione uma companhia.', tipo: 'erro' });
      return;
    }
    this.mensagemAeronave.set(null);
    this.salvandoAeronave.set(true);
    try {
      await this.airlineService.adicionarAeronave(this.airlineIdParaAeronave, this.novaAeronave);
      this.mensagemAeronave.set({ texto: 'Aeronave adicionada com sucesso.', tipo: 'ok' });
      this.novaAeronave = { modelo: '', codigoIcao: '', matricula: '', tiposOperacaoSuportados: [] };
    } catch (erro: any) {
      this.mensagemAeronave.set({ texto: this.extrairMensagemErro(erro) || 'Não foi possível adicionar a aeronave.', tipo: 'erro' });
    } finally {
      this.salvandoAeronave.set(false);
    }
  }

  async cadastrarRota(): Promise<void> {
    if (!this.airlineIdParaRota) {
      this.mensagemRota.set({ texto: 'Selecione uma companhia.', tipo: 'erro' });
      return;
    }
    this.mensagemRota.set(null);
    this.salvandoRota.set(true);
    try {
      await this.airlineService.adicionarRota(this.airlineIdParaRota, this.novaRota);
      this.mensagemRota.set({ texto: 'Rota adicionada com sucesso.', tipo: 'ok' });
      this.novaRota = { aeroportoOrigem: '', aeroportoDestino: '', distanciaMilhas: 0, numeroVoo: '', tipoOperacao: '', ratingMinimo: 0 };
    } catch (erro: any) {
      this.mensagemRota.set({ texto: this.extrairMensagemErro(erro) || 'Não foi possível adicionar a rota.', tipo: 'erro' });
    } finally {
      this.salvandoRota.set(false);
    }
  }

  private parseCsv(texto: string): Record<string, string>[] {
    const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (linhas.length < 2) return [];
    const colunas = linhas[0].split(',').map(c => c.trim());
    return linhas.slice(1).map(linha => {
      const valores = linha.split(',').map(v => v.trim());
      const registro: Record<string, string> = {};
      colunas.forEach((coluna, i) => (registro[coluna] = valores[i] ?? ''));
      return registro;
    });
  }

  private lerArquivo(input: HTMLInputElement): Promise<string> {
    return new Promise((resolve, reject) => {
      const arquivo = input.files?.[0];
      if (!arquivo) {
        reject('Nenhum arquivo selecionado.');
        return;
      }
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result as string);
      leitor.onerror = () => reject('Não foi possível ler o arquivo.');
      leitor.readAsText(arquivo);
    });
  }

  async importarCompanhiasCsv(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.resultadoImportCompanhias.set(null);
    this.importandoCompanhias.set(true);
    try {
      const texto = await this.lerArquivo(input);
      const linhas = this.parseCsv(texto);
      const resultado: ResultadoImportacao = { total: linhas.length, sucesso: 0, erros: [] };

      for (let i = 0; i < linhas.length; i++) {
        const l = linhas[i];
        try {
          await this.airlineService.criarCompanhia({
            nome: l['nome'],
            iata: l['iata'],
            icao: l['icao'],
            pais: l['pais'],
            callsignPadrao: l['callsignPadrao'],
          });
          resultado.sucesso++;
        } catch (erro: any) {
          resultado.erros.push(`Linha ${i + 2} (${l['icao'] || '?'}): ${this.extrairMensagemErro(erro) || 'erro desconhecido'}`);
        }
      }

      this.resultadoImportCompanhias.set(resultado);
      await this.carregarCompanhias();
    } catch (erro: any) {
      this.resultadoImportCompanhias.set({ total: 0, sucesso: 0, erros: [String(erro)] });
    } finally {
      this.importandoCompanhias.set(false);
      input.value = '';
    }
  }

  async importarAeronavesCsv(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.resultadoImportAeronaves.set(null);
    this.importandoAeronaves.set(true);
    try {
      const texto = await this.lerArquivo(input);
      const linhas = this.parseCsv(texto);
      const resultado: ResultadoImportacao = { total: linhas.length, sucesso: 0, erros: [] };

      for (let i = 0; i < linhas.length; i++) {
        const l = linhas[i];
        const companhia = this.companhias().find(c => c.icao === l['companhiaIcao']);
        if (!companhia) {
          resultado.erros.push(`Linha ${i + 2}: companhia com ICAO "${l['companhiaIcao']}" não encontrada.`);
          continue;
        }
        try {
          await this.airlineService.adicionarAeronave(companhia.id, {
            modelo: l['modelo'],
            codigoIcao: l['codigoIcao'],
            matricula: l['matricula'],
            tiposOperacaoSuportados: (l['tiposOperacaoSuportados'] || '').split('|').map(t => t.trim()).filter(Boolean),
          });
          resultado.sucesso++;
        } catch (erro: any) {
          resultado.erros.push(`Linha ${i + 2} (${l['codigoIcao'] || '?'}): ${this.extrairMensagemErro(erro) || 'erro desconhecido'}`);
        }
      }

      this.resultadoImportAeronaves.set(resultado);
    } catch (erro: any) {
      this.resultadoImportAeronaves.set({ total: 0, sucesso: 0, erros: [String(erro)] });
    } finally {
      this.importandoAeronaves.set(false);
      input.value = '';
    }
  }

  async importarRotasCsv(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.resultadoImportRotas.set(null);
    this.importandoRotas.set(true);
    try {
      const texto = await this.lerArquivo(input);
      const linhas = this.parseCsv(texto);
      const resultado: ResultadoImportacao = { total: linhas.length, sucesso: 0, erros: [] };

      for (let i = 0; i < linhas.length; i++) {
        const l = linhas[i];
        const companhia = this.companhias().find(c => c.icao === l['companhiaIcao']);
        if (!companhia) {
          resultado.erros.push(`Linha ${i + 2}: companhia com ICAO "${l['companhiaIcao']}" não encontrada.`);
          continue;
        }
        try {
          await this.airlineService.adicionarRota(companhia.id, {
            aeroportoOrigem: l['aeroportoOrigem'],
            aeroportoDestino: l['aeroportoDestino'],
            numeroVoo: l['numeroVoo'],
            distanciaMilhas: Number(l['distanciaMilhas']) || 0,
            tipoOperacao: l['tipoOperacao'],
            ratingMinimo: Number(l['ratingMinimo']) || 0,
          });
          resultado.sucesso++;
        } catch (erro: any) {
          resultado.erros.push(`Linha ${i + 2} (${l['numeroVoo'] || '?'}): ${this.extrairMensagemErro(erro) || 'erro desconhecido'}`);
        }
      }

      this.resultadoImportRotas.set(resultado);
    } catch (erro: any) {
      this.resultadoImportRotas.set({ total: 0, sucesso: 0, erros: [String(erro)] });
    } finally {
      this.importandoRotas.set(false);
      input.value = '';
    }
  }
}