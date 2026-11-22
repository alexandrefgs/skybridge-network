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
  seats: number;
  maxCargoKg: number;
}