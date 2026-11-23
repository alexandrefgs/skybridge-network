export type FreelanceJobKind =
  | 'Passengers'
  | 'Cargo'
  | 'Charter'
  | 'Executive'
  | 'Medevac'
  | 'Repatriation'
  | 'Humanitarian'
  | 'Ferry'
  | 'OrganTransport'
  | 'AirTaxi'
  | 'SportsTeam'
  | 'Skydiving';

export type DangerousGoodClass =
  | 'Explosives'
  | 'Gases'
  | 'FlammableLiquids'
  | 'FlammableSolids'
  | 'Oxidizers'
  | 'Toxic'
  | 'Radioactive'
  | 'Corrosives'
  | 'Miscellaneous';

export interface DangerousGood {
  name: string;
  class: DangerousGoodClass;
  quantityKg: number;
  unNumber: string | null;
}

export interface FreelanceLeg {
  sequence: number;
  origin: string;
  originIata: string | null;
  originName: string;
  destination: string;
  destinationIata: string | null;
  destinationName: string;
  distanceNm: number;
  passengerCount: number;
  passengerNames: string[];
  cargoKg: number;
  dangerousGoods: DangerousGood[];
}

export interface FreelanceJob {
  id: number;
  kind: FreelanceJobKind;
  origin: string;
  originIata: string | null;
  originName: string;
  destination: string;
  destinationIata: string | null;
  destinationName: string;
  distanceNm: number;
  client: string | null;
  briefing: string | null;
  legs: FreelanceLeg[];
  reward: number;
  expiresAtUtc: string;
  expired: boolean;
  aircraft: string[];
  warnings: string[];
  taken: boolean;
}

export interface FreelanceLegInput {
  origin: string;
  destination: string;
  passengerCount: number;
  cargoKg: number;
  passengerNames: string[];
  dangerousGoods: DangerousGood[];
}

export interface FreelanceJobInput {
  kind: FreelanceJobKind;
  reward: number;
  expiresAtUtc: string;
  aircraft: string[];
  legs: FreelanceLegInput[];
  client: string | null;
  briefing: string | null;
}

export interface FreelanceQuery {
  from: string | null;
  page: number;
}