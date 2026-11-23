import { AircraftCategoryCode } from '../aircraft/aircraft.models';

export type { PagedResult } from '../http/paged-result';

export interface Airline {
  id: number;
  name: string;
  iataCode: string | null;
  icaoCode: string | null;
  callsign: string | null;
  country: string | null;
  isActive: boolean;
  routeCount: number;
}

export interface FleetType {
  icaoCode: string;
  manufacturer: string;
  model: string;
  category: AircraftCategoryCode;
}

export interface AirlineDetail extends Airline {
  fleet: FleetType[];
  routesUpdatedAtUtc: string | null;
  routesSource: string | null;
  routesEdition: string | null;
}

export interface AirlineRoute {
  id: number;
  origin: string;
  originIata: string | null;
  originName: string;
  destination: string;
  destinationIata: string | null;
  destinationName: string;
  distanceNm: number;
  aircraft: string[];
  atsRoute: string | null;
  flightLevel: number | null;
}

export interface NetworkAirport {
  code: string;
  iataCode: string | null;
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteNetwork {
  airports: NetworkAirport[];
  links: [number, number][];
}

export interface AirlineQuery {
  search: string;
  active: boolean | null;
  page: number;
  pageSize: number;
}

export interface RouteQuery {
  search: string;
  page: number;
  pageSize: number;
}

export type AirportPair = readonly [string, string];

export interface RouteFilter {
  from: string;
  to: string | null;
}

export interface AirlineInput {
  name: string;
  iataCode: string | null;
  icaoCode: string | null;
  callsign: string | null;
  country: string | null;
  isActive: boolean;
}

export interface RouteDetailsInput {
  aircraft: string[];
  atsRoute: string | null;
  flightLevel: number | null;
}

export interface RouteInput extends RouteDetailsInput {
  origin: string;
  destination: string;
}

export interface RouteImportIssue {
  line: number;
  message: string;
}

export interface RouteImportResult {
  format: string;
  edition: string | null;
  added: number;
  updated: number;
  unchanged: number;
  skipped: number;
  fleetAdded: string[];
  issues: RouteImportIssue[];
}