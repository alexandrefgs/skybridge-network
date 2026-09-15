import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Header } from '../../../shared/header/header';
import { AuthService } from '../../../core/services/auth.service';
import { AirportService } from '../../../core/services/airport.service';
import { Airport, NovoAirportPayload } from '../../../core/models/airport.models';

@Component({
  selector: 'app-admin-aeroportos',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './aeroportos.html',
})
export class AdminAeroportos implements OnInit {
  aeroportos = signal<Airport[]>([]);
  carregando = signal(true);

  importando = signal(false);
  progressoImport = signal(0);
  totalImport = signal(0);
  sucessosImport = signal(0);
  errosImport = signal<string[]>([]);

  constructor(
    public auth: AuthService,
    private airportService: AirportService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.auth.ehAdmin()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    await this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.aeroportos.set(await this.airportService.listar());
    this.carregando.set(false);
  }

  private parseLinhaCsv(linha: string): string[] {
    const colunas: string[] = [];
    let atual = '';
    let dentroDeAspas = false;

    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];
      if (char === '"') {
        dentroDeAspas = !dentroDeAspas;
      } else if (char === ',' && !dentroDeAspas) {
        colunas.push(atual);
        atual = '';
      } else {
        atual += char;
      }
    }
    colunas.push(atual);
    return colunas;
  }

  async aoEscolherArquivo(event: Event): Promise<void> {
    const arquivo = (event.target as HTMLInputElement).files?.[0];
    if (!arquivo) return;

    const texto = await arquivo.text();
    const linhas = texto.split(/\r?\n/).filter(l => l.trim().length > 0);
    const linhasDados = linhas.slice(1);

    this.importando.set(true);
    this.totalImport.set(linhasDados.length);
    this.progressoImport.set(0);
    this.sucessosImport.set(0);
    this.errosImport.set([]);

    for (let i = 0; i < linhasDados.length; i++) {
      const colunas = this.parseLinhaCsv(linhasDados[i]);
      const [icao, iata, nome, cidade, pais, latitude, longitude] = colunas;

      try {
        const payload: NovoAirportPayload = {
          icao: (icao ?? '').trim(),
          iata: (iata ?? '').trim() || null,
          nome: (nome ?? '').trim(),
          cidade: (cidade ?? '').trim(),
          pais: (pais ?? '').trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
        };
        await this.airportService.criar(payload);
        this.sucessosImport.update(v => v + 1);
      } catch (erro: any) {
        this.errosImport.update(lista => [...lista, `Linha ${i + 2} (${icao}): ${erro?.error ?? 'erro desconhecido'}`]);
      }

      this.progressoImport.set(i + 1);
    }

    this.importando.set(false);
    (event.target as HTMLInputElement).value = '';
    await this.carregar();
  }
}