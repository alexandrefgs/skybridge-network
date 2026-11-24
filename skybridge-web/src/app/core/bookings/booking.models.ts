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
}