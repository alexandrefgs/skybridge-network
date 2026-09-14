export interface Airline {
  id: number;
  nome: string;
  iata: string;
  icao: string;
  pais: string;
  callsignPadrao: string;
}

export interface Aeronave {
  id: number;
  modelo: string;
  codigoIcao: string;
  tiposOperacaoSuportados: string[];
}

export interface AirlineDetalhe extends Airline {
  frota: Aeronave[];
}

export interface FlightRoute {
  id: number;
  aeroportoOrigem: string;
  aeroportoDestino: string;
  distanciaMilhas: number;
  numeroVoo: string;
  tipoOperacao: string;
  ratingMinimo: number;
}