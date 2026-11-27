import { PilotTransaction } from '../core/pilot/pilot.models';
import { Logbook, Pirep } from '../core/pireps/pirep.models';
import { filedPirep } from './freelance';

export const returnPirep: Pirep = {
  ...filedPirep, id: 52, leg: 2, legCount: 2, origin: 'SBGR', destination: 'SBFL',
  departedAtUtc: '2026-11-24T10:00:00Z', arrivedAtUtc: '2026-11-24T11:35:00Z', flightMinutes: 95, landingRateFpm: 210
};

export const pendingPirep: Pirep = {
  ...filedPirep, id: 53, origin: 'SBFL', destination: 'SBRJ', status: 'Pending', flag: 'Too short',
  departedAtUtc: '2026-11-25T09:00:00Z', arrivedAtUtc: '2026-11-25T09:40:00Z', flightMinutes: 40, landingRateFpm: null
};

export const monthLogbook: Logbook = {
  period: '30d',
  summary: { flights: 2, flightMinutes: 185, distanceNm: 556, earned: 4500, averageLandingRateFpm: 185, airports: 2, favoriteAircraft: 'C208' },
  network: {
    airports: [
      { code: 'SBFL', iataCode: 'FLN', name: 'Hercilio Luz', latitude: -27.67, longitude: -48.55 },
      { code: 'SBGR', iataCode: 'GRU', name: 'Guarulhos', latitude: -23.43, longitude: -46.47 }
    ],
    links: [[0, 1]]
  },
  flights: { items: [pendingPirep, returnPirep, filedPirep], page: 1, pageSize: 20, totalCount: 3 }
};

export const emptyLogbook: Logbook = {
  period: '30d',
  summary: { flights: 0, flightMinutes: 0, distanceNm: 0, earned: 0, averageLandingRateFpm: null, airports: 0, favoriteAircraft: null },
  network: { airports: [], links: [] },
  flights: { items: [], page: 1, pageSize: 20, totalCount: 0 }
};

export const transactions: PilotTransaction[] = [
  { id: 9, amount: 4500, description: 'Medevac SBFL → SBGR → SBFL', createdAtUtc: '2026-11-24T11:40:00Z' },
  { id: 8, amount: -150, description: 'Adjustment by staff', createdAtUtc: '2026-11-22T09:00:00Z' }
];