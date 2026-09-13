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
