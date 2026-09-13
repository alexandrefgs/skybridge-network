export interface VooAtivo {
  pilotId: number;
  callsign: string;
  latitude: number;
  longitude: number;
  altitudePes: number;
  velocidadeNos: number;
  heading: number;
  atualizadoEm: string;
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
}
