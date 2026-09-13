export interface PilotoResumo {
  id: number;
  nome: string;
  callsign: string;
  rating: number;
  pontosTotais: number;
}

export interface CarreiraPiloto {
  airlineId: number;
  airlineNome: string;
  horasVoadas: number;
  rankAtual: string;
}

export interface AwardConquistado {
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  dataConquista: string;
}

export interface PilotoDetalhe {
  id: number;
  nome: string;
  callsign: string;
  rating: number;
  pontosTotais: number;
  carreiras: CarreiraPiloto[];
  awards: AwardConquistado[];
}
