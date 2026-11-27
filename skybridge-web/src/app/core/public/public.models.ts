export interface PublicStats {
  totalFlights: number;
  flightsThisMonth: number;
  onlineVatsim: number | null;
  onlineIvao: number | null;
  aircraft: number;
  destinations: number;
  pilots: number;
  airlines: number;
}

export interface PublicFlight {
  id: number;
  flightNumber: string | null;
  airline: string | null;
  mission: string | null;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  aircraft: string;
  aircraftModel: string;
  pilot: string;
  flightMinutes: number;
  landingRateFpm: number | null;
  arrivedAtUtc: string;
}

export type LiveNetwork = 'VATSIM' | 'IVAO';

export interface LiveAirport {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface LiveFlight {
  network: LiveNetwork;
  networkId: number;
  callsign: string;
  pilot: string;
  latitude: number;
  longitude: number;
  altitudeFt: number;
  groundSpeedKt: number;
  heading: number;
  aircraft: string | null;
  aircraftModel: string | null;
  mission: string | null;
  airline: string | null;
  origin: LiveAirport | null;
  destination: LiveAirport | null;
}

export interface LiveMap {
  updatedAtUtc: string;
  vatsimAvailable: boolean;
  ivaoAvailable: boolean;
  flights: LiveFlight[];
}