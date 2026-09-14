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