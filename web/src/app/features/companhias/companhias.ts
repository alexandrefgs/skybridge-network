import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AirlineService } from '../../core/services/airline.service';
import { AirlineDetalhe } from '../../core/models/airline.models';

@Component({
  selector: 'app-companhias',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './companhias.html',
})
export class Companhias implements OnInit {
  companhias = signal<AirlineDetalhe[]>([]);
  carregando = signal(true);

  constructor(
    private airlineService: AirlineService,
    public auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.piloto()) {
      this.router.navigateByUrl('/login');
      return;
    }

    const lista = await this.airlineService.listar();
    const detalhes = await Promise.all(lista.map(a => this.airlineService.obterDetalhe(a.id)));
    this.companhias.set(detalhes);
    this.carregando.set(false);
  }
}