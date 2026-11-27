import { RouteNetwork } from '../airlines/airline.models';
import { Booking } from '../bookings/booking.models';
import { PagedResult } from '../http/paged-result';
import { Pilot } from '../pilot/pilot.models';

export type PirepStatus = 'Accepted' | 'Pending' | 'Rejected';

export interface Pirep {
  id: number;
  bookingId: number;
  pilot: string;
  leg: number;
  legCount: number;
  origin: string;
  destination: string;
  aircraft: string;
  distanceNm: number;
  departedAtUtc: string;
  arrivedAtUtc: string;
  flightMinutes: number;
  fuelUsedKg: number | null;
  landingRateFpm: number | null;
  remarks: string | null;
  status: PirepStatus;
  flag: string | null;
  reviewNote: string | null;
  filedAtUtc: string;
  reviewedAtUtc: string | null;
}

export interface PirepInput {
  departedAtUtc: string;
  arrivedAtUtc: string;
  fuelUsedKg: number | null;
  landingRateFpm: number | null;
  remarks: string | null;
}

export interface PirepFiled {
  pirep: Pirep;
  booking: Booking | null;
  rewardPaid: number | null;
  pilot: Pilot;
}

export type LogbookPeriod = '30d' | '1y' | 'all';

export interface LogbookSummary {
  flights: number;
  flightMinutes: number;
  distanceNm: number;
  earned: number;
  averageLandingRateFpm: number | null;
  airports: number;
  favoriteAircraft: string | null;
}

export interface Logbook {
  period: LogbookPeriod;
  summary: LogbookSummary;
  network: RouteNetwork;
  flights: PagedResult<Pirep>;
}