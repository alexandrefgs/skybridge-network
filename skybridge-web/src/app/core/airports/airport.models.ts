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
  longestRunwayFt: number | null;
}

export type RunwaySurfaceType = 'Paved' | 'Unpaved' | 'Unknown' | 'Water';

export interface Runway {
  name: string;
  lengthFt: number | null;
  widthFt: number | null;
  surface: string | null;
  surfaceType: RunwaySurfaceType;
  lighted: boolean;
  headingDegT: number | null;
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

export interface RunwayImportResult {
  added: number;
  updated: number;
  removed: number;
  airportsWithRunways: number;
}

export interface AirportCatalogImportResult {
  airports: AirportImportResult;
  runways: RunwayImportResult;
}