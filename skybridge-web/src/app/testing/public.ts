import { PublicFlight, PublicStats } from '../core/public/public.models';

export const publicStats: PublicStats = {
  totalFlights: 1284, flightsThisMonth: 97, onlineVatsim: 12, onlineIvao: 5,
  aircraft: 58, destinations: 214, pilots: 236, airlines: 9
};

export const publicFlights: PublicFlight[] = [
  {
    id: 98, flightNumber: 'GLO1042', airline: 'Gol Transportes Aéreos', mission: null,
    origin: 'SBFL', originName: 'Hercílio Luz', destination: 'SBGR', destinationName: 'Guarulhos',
    aircraft: 'B738', aircraftModel: 'Boeing 737-800', pilot: 'Ana S.', flightMinutes: 62, landingRateFpm: 140,
    arrivedAtUtc: '2026-11-26T20:00:00Z'
  },
  {
    id: 97, flightNumber: null, airline: null, mission: 'Medevac',
    origin: 'SBGR', originName: 'Guarulhos', destination: 'SBRJ', destinationName: 'Santos Dumont',
    aircraft: 'B350', aircraftModel: 'Beechcraft King Air 350', pilot: 'Rafael L.', flightMinutes: 55, landingRateFpm: null,
    arrivedAtUtc: '2026-11-26T18:00:00Z'
  }
];