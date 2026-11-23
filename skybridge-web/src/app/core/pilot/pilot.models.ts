export interface PilotLocation {
  code: string;
  iataCode: string | null;
  name: string;
  municipality: string | null;
  countryCode: string;
  latitude: number;
  longitude: number;
}

export interface Pilot {
  location: PilotLocation | null;
  flightHours: number;
  balance: number;
}

export interface PilotTransaction {
  id: number;
  amount: number;
  description: string;
  createdAtUtc: string;
}