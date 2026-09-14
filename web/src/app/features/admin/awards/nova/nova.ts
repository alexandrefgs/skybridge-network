import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../../../shared/header/header';
import { AuthService } from '../../../../core/services/auth.service';
import { AwardService } from '../../../../core/services/award.service';
import { UploadService } from '../../../../core/services/upload.service';

@Component({
  selector: 'app-admin-award-nova',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './nova.html',
})
export class AdminAwardNova implements OnInit {
  salvando = signal(false);
  erro = signal<string | null>(null);
  carregando = signal(true);

  awardId: number | null = null;
  modoEdicao = false;

  nome = '';
  descricao = '';
  fotoAtualUrl: string | null = null;
  fotoFile: File | null = null;
  fotoPreview = signal<string | null>(null);

  constructor(
    public auth: AuthService,
    private awardService: AwardService,
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
    this.awardId = idParam !== null ? Number(idParam) : null;

    if (this.modoEdicao && this.awardId !== null) {
      try {
        const award = await this.awardService.obterDetalhe(this.awardId);
        this.nome = award.nome;
        this.descricao = award.descricao ?? '';
        this.fotoAtualUrl = award.imagemUrl;
      } catch {
        this.erro.set('Award não encontrada.');
      }
    }

    this.carregando.set(false);
  }

  aoSelecionarFoto(event: Event): void {
    const arquivo = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.fotoFile = arquivo;
    this.fotoPreview.set(arquivo ? URL.createObjectURL(arquivo) : null);
  }

  podeSalvar(): boolean {
    return this.nome.trim().length > 0;
  }

  async salvar(): Promise<void> {
    if (!this.podeSalvar()) return;

    this.erro.set(null);
    this.salvando.set(true);
    try {
      const payload = {
        nome: this.nome.trim(),
        descricao: this.descricao.trim() || null,
      };

      const award = this.modoEdicao && this.awardId !== null
        ? await this.awardService.atualizar(this.awardId, payload)
        : await this.awardService.criar(payload);

      if (this.fotoFile) {
        const resultado = await this.uploadService.uploadImagem(this.fotoFile);
        await this.awardService.definirImagem(award.id, resultado.url);
      }

      this.router.navigateByUrl('/admin/awards');
    } catch (erro: any) {
      this.erro.set(erro?.error ?? 'Não foi possível salvar a award.');
    } finally {
      this.salvando.set(false);
    }
  }

  cancelar(): void {
    this.router.navigateByUrl('/admin/awards');
  }
}