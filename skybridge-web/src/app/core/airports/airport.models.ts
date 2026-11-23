export type AirportType = 'Small' | 'Medium' | 'Large';

export interface Airport {
  ident: string;
  icaoCode: string | null;
  iataCode: string | null;
  name: string;
  type: AirportType;
  latitude: number;
  longitude: number;
  elevationFt: number | null;
  countryCode: string;
  regionCode: string;
  municipality: string | null;
  scheduledService: boolean;
}

export type { PagedResult } from '../http/paged-result';

export interface AirportQuery {
  search: string;
  country: string;
  page: number;
}

export interface AirportImportResult {
  added: number;
  updated: number;
  unchanged: number;
  total: number;
}