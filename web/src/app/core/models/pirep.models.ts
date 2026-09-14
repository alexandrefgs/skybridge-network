export interface NovoPirep {
  flightRouteId: number;
  aircraftId: number;
  horasDeVoo: number;
  taxaDescidaTouchdownFpm: number;
  rede: string;
}

export interface PirepResultado {
  id: number;
  qualidadePouso: string;
  pontosGanhos: number;
  status: string;
  ratingAtualizado: number;
  pontosTotaisAtualizados: number;
  novaPatente: string | null;
}

export interface UltimoVoo {
  pirepId: number;
  pilotCallsign: string;
  pilotNome: string;
  vooCallsign: string;
  aeroportoOrigem: string;
  aeroportoDestino: string;
  horasDeVoo: number;
  aeronaveModelo: string;
  rede: string;
  status: string;
  dataVoo: string;
  companhiaNome: string;
}

export interface PirepPendente {
  id: number;
  pilotCallsign: string;
  pilotNome: string;
  vooCallsign: string;
  aeroportoOrigem: string;
  aeroportoDestino: string;
  aeronaveModelo: string;
  distanciaMilhas: number;
  taxaDescidaTouchdownFpm: number;
  dataVoo: string;
}

export interface TelemetriaLog {
  latitude: number;
  longitude: number;
  altitudePes: number;
  velocidadeNos: number;
  heading: number;
  estaNoSolo: boolean;
  velocidadeVerticalFpm: number;
  pitch: number;
  bank: number;
  flapsPercentual: number;
  spoilersArmado: boolean;
  spoilersPercentual: number;
  trainPousoPercentual: number;
  squawk: string | null;
  frequenciaComAtiva: string | null;
  aeronaveNome: string | null;
  registradoEmUtc: string;
}

export interface PirepDetalhe {
  id: number;
  pilotCallsign: string;
  pilotNome: string;
  vooCallsign: string;
  aeroportoOrigem: string;
  aeroportoDestino: string;
  aeronaveModelo: string;
  horasDeVoo: number;
  taxaDescidaTouchdownFpm: number;
  qualidadePouso: string;
  pontosGanhos: number;
  impactoNoRating: number;
  status: string;
  rede: string;
  dataVoo: string;
  observacoes: string | null;
}

export interface PirepDetalhe {
  id: number;
  pilotCallsign: string;
  pilotNome: string;
  vooCallsign: string;
  aeroportoOrigem: string;
  aeroportoDestino: string;
  aeronaveModelo: string;
  aeronaveCodigoIcao: string;
  horasDeVoo: number;
  taxaDescidaTouchdownFpm: number;
  qualidadePouso: string;
  pontosGanhos: number;
  impactoNoRating: number;
  status: string;
  rede: string;
  dataVoo: string;
  observacoes: string | null;
}