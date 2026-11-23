import { FreelanceJob } from '../freelance/freelance.models';

export type BookingStatus = 'Active' | 'Completed' | 'Cancelled' | 'Expired';

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
}