export interface Airport {
  id: number;
  icao: string;
  iata: string | null;
  nome: string;
  cidade: string;
  pais: string;
  latitude: number;
  longitude: number;
}

export interface NovoAirportPayload {
  icao: string;
  iata: string | null;
  nome: string;
  cidade: string;
  pais: string;
  latitude: number;
  longitude: number;
}