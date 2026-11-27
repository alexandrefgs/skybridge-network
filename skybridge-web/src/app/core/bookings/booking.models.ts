import { EngineType } from '../aircraft/aircraft.models';
import { FreelanceJob } from '../freelance/freelance.models';

export type BookingStatus = 'Active' | 'Completed' | 'Cancelled' | 'Expired';

export interface AirlineFlight {
  routeId: number | null;
  flightNumber: string;
  airline: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  distanceNm: number;
  atsRoute: string | null;
  flightLevel: number | null;
}

export interface FlightPlanAirport {
  code: string;
  name: string | null;
  runway: string | null;
  elevationFt: number;
  transitionAltitudeFt: number;
  transitionLevelFt: number;
  metar: string | null;
  taf: string | null;
}

export interface FlightPlanAlternate {
  code: string;
  name: string | null;
  runway: string | null;
  distanceNm: number;
  cruiseAltitudeFt: number;
  burnKg: number;
  enrouteMinutes: number;
  route: string | null;
  metar: string | null;
}

export interface FlightPlanFuel {
  taxiKg: number;
  tripKg: number;
  contingencyKg: number;
  alternateKg: number;
  reserveKg: number;
  extraKg: number;
  minTakeoffKg: number;
  takeoffKg: number;
  blockKg: number;
  landingKg: number;
  averageFlowKgPerHour: number;
}

export interface FlightPlanPerformance {
  costIndex: string | null;
  sid: string | null;
  star: string | null;
  stepClimbs: string | null;
  averageWindDirection: number;
  averageWindSpeedKts: number;
  averageWindComponentKts: number;
  averageTempDeviation: number;
  cruiseTasKts: number;
  cruiseMach: string | null;
  climbProfile: string | null;
  cruiseProfile: string | null;
  descentProfile: string | null;
}

export interface NavlogFix {
  ident: string;
  name: string | null;
  type: string;
  airway: string | null;
  stage: string | null;
  sidStar: boolean;
  altitudeFt: number;
  distanceNm: number;
  trackMag: number;
  windDirection: number;
  windSpeedKts: number;
  oatC: number;
  groundSpeedKts: number;
  elapsedMinutes: number;
  fuelUsedKg: number;
  fuelOnboardKg: number;
  latitude: number;
  longitude: number;
}

export interface FlightPlanDetails {
  departure: FlightPlanAirport;
  arrival: FlightPlanAirport;
  alternate: FlightPlanAlternate | null;
  fuel: FlightPlanFuel;
  performance: FlightPlanPerformance;
  atcFlightPlan: string | null;
  navlog: NavlogFix[];
}

export interface FlightPlan {
  leg: number;
  simBriefId: string;
  generatedAtUtc: string;
  importedAtUtc: string;
  airac: string | null;
  origin: string;
  destination: string;
  alternate: string | null;
  aircraft: string;
  registration: string | null;
  callsign: string | null;
  route: string;
  cruiseAltitudeFt: number;
  distanceNm: number;
  enrouteMinutes: number;
  blockFuelKg: number;
  takeoffFuelKg: number;
  landingFuelKg: number;
  tripFuelKg: number;
  passengerCount: number;
  cargoKg: number;
  zeroFuelWeightKg: number;
  takeoffWeightKg: number;
  landingWeightKg: number;
  details: FlightPlanDetails | null;
}

export interface Booking {
  id: number;
  status: BookingStatus;
  source: 'Freelance' | 'Airline';
  aircraft: string;
  currentLeg: number;
  legCount: number;
  legInProgress: boolean;
  bookedAtUtc: string;
  startDeadlineUtc: string;
  startedAtUtc: string | null;
  legStartedAtUtc: string | null;
  job: FreelanceJob | null;
  flightNumber: string | null;
  payPerHour: number;
  flight: AirlineFlight | null;
  flightPlan: FlightPlan | null;
  aircraftEngine: EngineType;
}