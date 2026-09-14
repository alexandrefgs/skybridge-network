export interface EtapaTour {
  ordem: number;
  flightRouteId: number;
  airlineId: number;
  airlineNome: string;
  aeroportoOrigem: string;
  aeroportoDestino: string;
  numeroVoo: string;
}

export interface Tour {
  id: number;
  nome: string;
  descricao: string | null;
  fotoUrl: string | null;
  fotoCapaUrl: string | null;
  pontosBonusConclusao: number;
  awardNome: string | null;
  etapas: EtapaTour[];
}

export interface NovaEtapaTourPayload {
  flightRouteId: number;
  ordem: number;
}

export interface NovoTourPayload {
  nome: string;
  descricao: string | null;
  pontosBonusConclusao: number;
  awardId: number | null;
  etapas: NovaEtapaTourPayload[];
}

export interface TourProgresso {
  tourId: number;
  tourNome: string;
  etapasCompletas: number;
  totalEtapas: number;
  concluido: boolean;
}