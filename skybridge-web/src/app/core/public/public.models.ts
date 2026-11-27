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