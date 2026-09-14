import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../../shared/header/header';
import { AuthService } from '../../../core/services/auth.service';
import { AirlineService } from '../../../core/services/airline.service';
import { Airline, Aeronave, FlightRoute } from '../../../core/models/airline.models';
import { NovaAirline, NovaAeronave, NovaRota } from '../../../core/models/admin.models';
import { PAISES, Pais, classeBandeira, paisPorNome } from '../../../core/data/paises';

type Feedback = { texto: string; tipo: 'ok' | 'erro' } | null;
type ResultadoImportacao = { total: number; sucesso: number; erros: string[] };
type Secao = 'companhia' | 'aeronave' | 'rota' | null;

@Component({
  selector: 'app-admin-companhias',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './companhias.html',
})
export class AdminCompanhias implements OnInit {
  companhias = signal<Airline[]>([]);
  carregando = signal(true);

  tiposOperacao = ['Executivo', 'Regional', 'Internacional', 'Cargueiro'];
  paises = PAISES;

  secaoAberta = signal<Secao>(null);

  editandoCompanhiaId: number | null = null;
  novaCompanhia: NovaAirline = { nome: '', iata: '', icao: '', pais: '', callsignPadrao: '' };
  salvandoCompanhia = signal(false);
  mensagemCompanhia = signal<Feedback>(null);

  paisDropdownAberto = signal(false);
  buscaPais = signal('');

  paisesFiltrados = computed(() => {
    const termo = this.buscaPais().trim().toLowerCase();
    if (!termo) return this.paises;
    return this.paises.filter(p => p.nome.toLowerCase().includes(termo));
  });

  airlineIdParaAeronave: number | null = null;
  novaAeronave: NovaAeronave = { modelo: '', codigoIcao: '', matricula: '', tiposOperacaoSuportados: [] };
  salvandoAeronave = signal(false);
  mensagemAeronave = signal<Feedback>(null);

  airlineIdParaRota: number | null = null;
  novaRota: NovaRota = { aeroportoOrigem: '', aeroportoDestino: '', distanciaMilhas: 0, numeroVoo: '', tipoOperacao: '', ratingMinimo: 0 };
  salvandoRota = signal(false);
  mensagemRota = signal<Feedback>(null);

  editandoRotaId: number | null = null;
  rotasDaCompanhiaSelecionada = signal<FlightRoute[]>([]);
  frotaDaCompanhiaSelecionada = signal<Aeronave[]>([]);
  carregandoRotasTabela = signal(false);
  rotaParaExcluir = signal<FlightRoute | null>(null);
  excluindoRota = signal<number | null>(null);

  buscaRota = signal('');
  paginaAtualRotas = signal(1);
  itensPorPaginaRotas = 10;

  rotasFiltradas = computed(() => {
    const termo = this.buscaRota().trim().toUpperCase();
    if (!termo) return this.rotasDaCompanhiaSelecionada();

    return this.rotasDaCompanhiaSelecionada().filter(r =>
      r.aeroportoOrigem.toUpperCase().includes(termo) ||
      r.aeroportoDestino.toUpperCase().includes(termo) ||
      r.numeroVoo.toUpperCase().includes(termo)
    );
  });

  totalPaginasRotas = computed(() => {
    return Math.max(1, Math.ceil(this.rotasFiltradas().length / this.itensPorPaginaRotas));
  });

  rotasDaPaginaAtual = computed(() => {
    const inicio = (this.paginaAtualRotas() - 1) * this.itensPorPaginaRotas;
    return this.rotasFiltradas().slice(inicio, inicio + this.itensPorPaginaRotas);
  });

  importandoCompanhias = signal(false);
  resultadoImportCompanhias = signal<ResultadoImportacao | null>(null);

  importandoAeronaves = signal(false);
  resultadoImportAeronaves = signal<ResultadoImportacao | null>(null);

  importandoRotas = signal(false);
  resultadoImportRotas = signal<ResultadoImportacao | null>(null);

  constructor(
    public auth: AuthService,
    private airlineService: AirlineService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.ehAdmin()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    await this.carregarCompanhias();

    const editarId = this.route.snapshot.queryParamMap.get('editar');
    if (editarId) {
      const id = Number(editarId);
      this.carregarParaEdicao(id);
      this.secaoAberta.set('companhia');

      this.airlineIdParaAeronave = id;
      this.airlineIdParaRota = id;
      await this.carregarRotasDaCompanhia(id);
    }
  }

  alternarSecao(secao: Exclude<Secao, null>): void {
    this.secaoAberta.set(this.secaoAberta() === secao ? null : secao);
  }

  async carregarCompanhias(): Promise<void> {
    this.carregando.set(true);
    this.companhias.set(await this.airlineService.listar());
    this.carregando.set(false);
  }

  carregarParaEdicao(id: number): void {
    const companhia = this.companhias().find(c => c.id === id);
    if (!companhia) {
      this.mensagemCompanhia.set({ texto: 'Companhia não encontrada para edição.', tipo: 'erro' });
      return;
    }

    this.editandoCompanhiaId = companhia.id;
    this.novaCompanhia = {
      nome: companhia.nome,
      iata: companhia.iata,
      icao: companhia.icao,
      pais: companhia.pais,
      callsignPadrao: companhia.callsignPadrao,
    };
  }

  cancelarEdicao(): void {
    this.editandoCompanhiaId = null;
    this.novaCompanhia = { nome: '', iata: '', icao: '', pais: '', callsignPadrao: '' };
    this.mensagemCompanhia.set(null);
    this.router.navigate([], { queryParams: {} });
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

  classeBandeiraPais(codigo: string): string {
    return classeBandeira(codigo);
  }

  codigoDoPaisSelecionado(): string {
    const p = paisPorNome(this.novaCompanhia.pais);
    return p ? p.codigo : '';
  }

  alternarPaisDropdown(): void {
    this.paisDropdownAberto.set(!this.paisDropdownAberto());
    if (!this.paisDropdownAberto()) this.buscaPais.set('');
  }

  selecionarPais(pais: Pais): void {
    this.novaCompanhia.pais = pais.nome;
    this.paisDropdownAberto.set(false);
    this.buscaPais.set('');
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
      if (this.editandoCompanhiaId) {
        await this.airlineService.atualizarCompanhia(this.editandoCompanhiaId, this.novaCompanhia);
        this.mensagemCompanhia.set({ texto: 'Companhia atualizada com sucesso.', tipo: 'ok' });
      } else {
        await this.airlineService.criarCompanhia(this.novaCompanhia);
        this.mensagemCompanhia.set({ texto: 'Companhia cadastrada com sucesso.', tipo: 'ok' });
        this.novaCompanhia = { nome: '', iata: '', icao: '', pais: '', callsignPadrao: '' };
      }
      await this.carregarCompanhias();
    } catch (erro: any) {
      this.mensagemCompanhia.set({ texto: this.extrairMensagemErro(erro) || 'Não foi possível salvar a companhia.', tipo: 'erro' });
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

  async aoSelecionarCompanhiaRota(): Promise<void> {
    this.editandoRotaId = null;
    this.novaRota = { aeroportoOrigem: '', aeroportoDestino: '', distanciaMilhas: 0, numeroVoo: '', tipoOperacao: '', ratingMinimo: 0 };
    this.mensagemRota.set(null);
    this.buscaRota.set('');
    this.paginaAtualRotas.set(1);

    if (!this.airlineIdParaRota) {
      this.rotasDaCompanhiaSelecionada.set([]);
      this.frotaDaCompanhiaSelecionada.set([]);
      return;
    }

    await this.carregarRotasDaCompanhia(this.airlineIdParaRota);
  }

  async carregarRotasDaCompanhia(airlineId: number): Promise<void> {
    this.carregandoRotasTabela.set(true);
    const rotas = await this.airlineService.listarRotas(airlineId);
    const detalhe = await this.airlineService.obterDetalhe(airlineId);
    this.rotasDaCompanhiaSelecionada.set(rotas);
    this.frotaDaCompanhiaSelecionada.set(detalhe.frota);
    this.carregandoRotasTabela.set(false);
    this.paginaAtualRotas.set(1);
  }

  aoBuscarRota(termo: string): void {
    this.buscaRota.set(termo);
    this.paginaAtualRotas.set(1);
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasRotas()) return;
    this.paginaAtualRotas.set(pagina);
  }

  codigoIcaoDaRota(rota: FlightRoute): string {
    const companhia = this.companhias().find(c => c.id === this.airlineIdParaRota);
    return companhia ? (companhia.icao + rota.numeroVoo) : rota.numeroVoo;
  }

  aeronavesSuportadasDaRota(rota: FlightRoute): string {
    const suportadas = this.frotaDaCompanhiaSelecionada()
      .filter(a => a.tiposOperacaoSuportados.includes(rota.tipoOperacao))
      .map(a => a.codigoIcao);
    return suportadas.length > 0 ? suportadas.join(', ') : '—';
  }

  editarRota(rota: FlightRoute): void {
    this.editandoRotaId = rota.id;
    this.novaRota = {
      aeroportoOrigem: rota.aeroportoOrigem,
      aeroportoDestino: rota.aeroportoDestino,
      distanciaMilhas: rota.distanciaMilhas,
      numeroVoo: rota.numeroVoo,
      tipoOperacao: rota.tipoOperacao,
      ratingMinimo: rota.ratingMinimo,
    };
    this.mensagemRota.set(null);
  }

  cancelarEdicaoRota(): void {
    this.editandoRotaId = null;
    this.novaRota = { aeroportoOrigem: '', aeroportoDestino: '', distanciaMilhas: 0, numeroVoo: '', tipoOperacao: '', ratingMinimo: 0 };
    this.mensagemRota.set(null);
  }

  pedirConfirmacaoRota(rota: FlightRoute): void {
    this.rotaParaExcluir.set(rota);
  }

  cancelarExclusaoRota(): void {
    this.rotaParaExcluir.set(null);
  }

  async confirmarExclusaoRota(): Promise<void> {
    const rota = this.rotaParaExcluir();
    if (!rota || !this.airlineIdParaRota) return;

    this.excluindoRota.set(rota.id);
    this.rotaParaExcluir.set(null);
    try {
      await this.airlineService.excluirRota(this.airlineIdParaRota, rota.id);
      await this.carregarRotasDaCompanhia(this.airlineIdParaRota);
    } catch (erro: any) {
      alert(this.extrairMensagemErro(erro) || 'Não foi possível excluir a rota.');
    } finally {
      this.excluindoRota.set(null);
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
      if (this.editandoRotaId) {
        await this.airlineService.atualizarRota(this.airlineIdParaRota, this.editandoRotaId, this.novaRota);
        this.mensagemRota.set({ texto: 'Rota atualizada com sucesso.', tipo: 'ok' });
        this.editandoRotaId = null;
      } else {
        await this.airlineService.adicionarRota(this.airlineIdParaRota, this.novaRota);
        this.mensagemRota.set({ texto: 'Rota adicionada com sucesso.', tipo: 'ok' });
        this.novaRota = { aeroportoOrigem: '', aeroportoDestino: '', distanciaMilhas: 0, numeroVoo: '', tipoOperacao: '', ratingMinimo: 0 };
      }
      await this.carregarRotasDaCompanhia(this.airlineIdParaRota);
    } catch (erro: any) {
      this.mensagemRota.set({ texto: this.extrairMensagemErro(erro) || 'Não foi possível salvar a rota.', tipo: 'erro' });
    } finally {
      this.salvandoRota.set(false);
    }
  }

  private parseCsv(texto: string): Record<string, string>[] {
    const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (linhas.length < 2) {
      return [];
    }
    const colunas = linhas[0].split(',').map(c => c.trim());
    const registros: Record<string, string>[] = [];
    for (let i = 1; i < linhas.length; i++) {
      const valores = linhas[i].split(',').map(v => v.trim());
      const registro: Record<string, string> = {};
      for (let j = 0; j < colunas.length; j++) {
        registro[colunas[j]] = valores[j] ?? '';
      }
      registros.push(registro);
    }
    return registros;
  }

  private lerArquivo(input: HTMLInputElement): Promise<string> {
    return new Promise((resolve, reject) => {
      const arquivo = input.files ? input.files[0] : null;
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
          const dto: NovaAirline = {
            nome: l['nome'],
            iata: l['iata'],
            icao: l['icao'],
            pais: l['pais'],
            callsignPadrao: l['callsignPadrao'],
          };
          await this.airlineService.criarCompanhia(dto);
          resultado.sucesso++;
        } catch (erro: any) {
          const icaoLinha = l['icao'] || '?';
          resultado.erros.push('Linha ' + (i + 2) + ' (' + icaoLinha + '): ' + (this.extrairMensagemErro(erro) || 'erro desconhecido'));
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
          resultado.erros.push('Linha ' + (i + 2) + ': companhia com ICAO "' + l['companhiaIcao'] + '" não encontrada.');
          continue;
        }
        try {
          const tipos = (l['tiposOperacaoSuportados'] || '').split('|').map(t => t.trim()).filter(t => t.length > 0);
          const dto: NovaAeronave = {
            modelo: l['modelo'],
            codigoIcao: l['codigoIcao'],
            matricula: l['matricula'],
            tiposOperacaoSuportados: tipos,
          };
          await this.airlineService.adicionarAeronave(companhia.id, dto);
          resultado.sucesso++;
        } catch (erro: any) {
          const codigoLinha = l['codigoIcao'] || '?';
          resultado.erros.push('Linha ' + (i + 2) + ' (' + codigoLinha + '): ' + (this.extrairMensagemErro(erro) || 'erro desconhecido'));
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
          resultado.erros.push('Linha ' + (i + 2) + ': companhia com ICAO "' + l['companhiaIcao'] + '" não encontrada.');
          continue;
        }
        try {
          const dto: NovaRota = {
            aeroportoOrigem: l['aeroportoOrigem'],
            aeroportoDestino: l['aeroportoDestino'],
            numeroVoo: l['numeroVoo'],
            distanciaMilhas: Number(l['distanciaMilhas']) || 0,
            tipoOperacao: l['tipoOperacao'],
            ratingMinimo: Number(l['ratingMinimo']) || 0,
          };
          await this.airlineService.adicionarRota(companhia.id, dto);
          resultado.sucesso++;
        } catch (erro: any) {
          const numeroLinha = l['numeroVoo'] || '?';
          resultado.erros.push('Linha ' + (i + 2) + ' (' + numeroLinha + '): ' + (this.extrairMensagemErro(erro) || 'erro desconhecido'));
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