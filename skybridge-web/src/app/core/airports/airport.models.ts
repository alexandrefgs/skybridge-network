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

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface AirportQuery {
  search: string;
  country: string;
  page: number;
}