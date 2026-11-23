export type AircraftCategoryCode =
  | 'SinglePiston'
  | 'TwinPiston'
  | 'Turboprop'
  | 'Regional'
  | 'LightJet'
  | 'MidSizeJet'
  | 'LargeBusinessJet'
  | 'Medium'
  | 'Heavy';

export type EngineType = 'Piston' | 'Turboprop' | 'Jet';

export interface AircraftCategory {
  code: AircraftCategoryCode;
  name: string;
  requiredHours: number;
  payPerHour: number;
}

export interface AircraftType {
  icaoCode: string;
  manufacturer: string;
  model: string;
  category: AircraftCategoryCode;
  engineType: EngineType;
  engineCount: number;
  rangeNm: number;
  cruiseSpeedKts: number;
  serviceCeilingFt: number;
  seats: number;
  maxCargoKg: number;
  minRunwayFt: number;
  requiresPavedRunway: boolean;
}

export interface AircraftTypeQuery {
  category: AircraftCategoryCode | null;
  search: string;
  page: number;
  pageSize: number;
}