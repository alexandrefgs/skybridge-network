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
}