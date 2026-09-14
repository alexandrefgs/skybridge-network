import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../shared/header/header';
import { AuthService } from '../../core/services/auth.service';
import { AirlineService } from '../../core/services/airline.service';
import { AirlineDetalhe } from '../../core/models/airline.models';
import { classeBandeira, paisPorNome } from '../../core/data/paises';

@Component({
  selector: 'app-companhias',
  standalone: true,
  imports: [CommonModule, Header, RouterLink],
  templateUrl: './companhias.html',
})
export class Companhias implements OnInit {
  companhias = signal<AirlineDetalhe[]>([]);
  carregando = signal(true);
  excluindo = signal<number | null>(null);
  companhiaParaExcluir = signal<AirlineDetalhe | null>(null);

  constructor(
    private airlineService: AirlineService,
    public auth: AuthService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    if (!this.auth.piloto()) {
      this.router.navigateByUrl('/login');
      return;
    }

    await this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    const lista = await this.airlineService.listar();
    const detalhes = await Promise.all(lista.map(a => this.airlineService.obterDetalhe(a.id)));
    this.companhias.set(detalhes);
    this.carregando.set(false);
  }

  classeBandeiraDoPais(pais: string): string {
    const encontrado = paisPorNome(pais);
    return encontrado ? classeBandeira(encontrado.codigo) : '';
  }

  editar(evento: Event, companhia: AirlineDetalhe): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.router.navigate(['/admin/companhias'], { queryParams: { editar: companhia.id } });
  }

  pedirConfirmacao(evento: Event, companhia: AirlineDetalhe): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.companhiaParaExcluir.set(companhia);
  }

  cancelarExclusao(): void {
    this.companhiaParaExcluir.set(null);
  }

  async confirmarExclusao(): Promise<void> {
    const companhia = this.companhiaParaExcluir();
    if (!companhia) return;

    this.excluindo.set(companhia.id);
    this.companhiaParaExcluir.set(null);
    try {
      await this.airlineService.excluirCompanhia(companhia.id);
      this.companhias.update(atual => atual.filter(c => c.id !== companhia.id));
    } catch (erro: any) {
      alert(erro?.error ?? 'Não foi possível excluir a companhia.');
    } finally {
      this.excluindo.set(null);
    }
  }
}