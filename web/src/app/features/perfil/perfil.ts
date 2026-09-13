import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PilotService } from '../../core/services/pilot.service';
import { PilotoDetalhe } from '../../core/models/pilot.models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  piloto = signal<PilotoDetalhe | null>(null);
  carregando = signal(true);

  constructor(
    public auth: AuthService,
    private pilotService: PilotService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const logado = this.auth.piloto();
    if (!logado) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.piloto.set(await this.pilotService.obterDetalhe(logado.id));
    this.carregando.set(false);
  }

  estrelas(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? 1 : 0));
  }
}
