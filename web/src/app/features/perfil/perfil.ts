import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Header } from '../../shared/header/header';
import { AuthService } from '../../core/services/auth.service';
import { PilotService } from '../../core/services/pilot.service';
import { PirepService } from '../../core/services/pirep.service';
import { AwardConquistado, PilotoDetalhe } from '../../core/models/pilot.models';
import { UltimoVoo } from '../../core/models/pirep.models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  piloto = signal<PilotoDetalhe | null>(null);
  historico = signal<UltimoVoo[]>([]);
  carregando = signal(true);

  constructor(
    public auth: AuthService,
    private pilotService: PilotService,
    private pirepService: PirepService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const logado = this.auth.piloto();
    if (!logado) {
      this.router.navigateByUrl('/login');
      return;
    }

    const [detalhe, historico] = await Promise.all([
      this.pilotService.obterDetalhe(logado.id),
      this.pirepService.listarUltimos(10, logado.id),
    ]);

    this.piloto.set(detalhe);
    this.historico.set(historico);
    this.carregando.set(false);
  }

  estrelas(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? 1 : 0));
  }

  awardsPorOrigem(origem: string): AwardConquistado[] {
    return this.piloto()?.awards.filter((a) => a.origem === origem) ?? [];
  }

  corStatus(status: string): string {
    switch (status) {
      case 'Aprovado': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      case 'PendenteAprovacao': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      case 'Rejeitado': return 'text-red-400 border-red-400/30 bg-red-400/10';
      default: return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
    }
  }

  rotuloStatus(status: string): string {
    switch (status) {
      case 'Aprovado': return 'Aprovado';
      case 'PendenteAprovacao': return 'Em análise';
      case 'Rejeitado': return 'Rejeitado';
      default: return status;
    }
  }
}