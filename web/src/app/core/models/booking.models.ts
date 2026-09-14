export interface NovoBookingPayload {
  flightRouteId: number;
  aircraftId: number;
  callsign: string;
  dataVoo: string;
  horaPartidaUtc: number;
  minutoPartidaUtc: number;
  horaChegadaUtc: number;
  minutoChegadaUtc: number;
}

export interface Booking {
  id: number;
  callsign: string;
  aeroportoOrigem: string;
  aeroportoDestino: string;
  numeroVoo: string;
  aeronaveModelo: string;
  aeronaveCodigoIcao: string;
  matricula: string;
  status: string;
  dataVooUtc: string;
  simBriefPerfilId: string | null;
  simBriefOfpId: string | null;
  alternado1: string | null;
  alternado2: string | null;
  alternado3: string | null;
  alternado4: string | null;
  payloadPassageiros: number | null;
  payloadCargaKg: number | null;
  ofpDistanciaMn: number | null;
  ofpBlockFuelKg: number | null;
  ofpTripFuelKg: number | null;
  ofpRotaTexto: string | null;

  ofpAirTimeMin?: number | null;
  ofpBlockTimeMin?: number | null;
  ofpFlightAltitude?: number | null;
  ofpCruiseProfile?: string | null;
  ofpAverageWind?: string | null;
  ofpWindComponent?: string | null;
  ofpIsaDeviation?: string | null;
  ofpEnrouteBurnKg?: number | null;
  ofpEmptyWeightKg?: number | null;
  ofpEstimatedZfwKg?: number | null;
  ofpEstimatedTowKg?: number | null;
  ofpEstimatedLwKg?: number | null;
  ofpBaggageKg?: number | null;
  ofpMaxZfwKg?: number | null;
  ofpMaxTowKg?: number | null;
  ofpMaxLwKg?: number | null;
}

export interface StatusVoo {
  status: string;
  prontoParaPirep: boolean;
  horasDeVoo: number | null;
  taxaDescidaTouchdownFpm: number | null;
}

export interface SimBriefRedirect {
  url: string;
}

export interface Metar {
  icao: string;
  raw: string;
  temperaturaC: number | null;
  qnhHpa: number | null;
  ventoDirecao: number | null;
  ventoVelocidadeKt: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Taf {
  icao: string;
  raw: string;
}