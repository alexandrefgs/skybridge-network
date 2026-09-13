export interface NovaAirline {
  nome: string;
  iata: string;
  icao: string;
  pais: string;
  callsignPadrao: string;
}

export interface NovaAeronave {
  modelo: string;
  codigoIcao: string;
  matricula: string;
  tiposOperacaoSuportados: string[];
}

export interface NovaRota {
  aeroportoOrigem: string;
  aeroportoDestino: string;
  distanciaMilhas: number;
  numeroVoo: string;
  tipoOperacao: string;
  ratingMinimo: number;
}
