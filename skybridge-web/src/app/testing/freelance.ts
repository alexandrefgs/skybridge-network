import { FreelanceJob, FreelanceLeg } from '../core/freelance/freelance.models';
import { Pilot } from '../core/pilot/pilot.models';

const florianopolisToGuarulhos: FreelanceLeg = {
  sequence: 1,
  origin: 'SBFL', originIata: 'FLN', originName: 'Hercílio Luz International Airport',
  destination: 'SBGR', destinationIata: 'GRU', destinationName: 'Guarulhos International Airport',
  distanceNm: 278, passengerCount: 2, passengerNames: ['Maria Souza'], cargoKg: 150,
  dangerousGoods: [{ name: 'Medical oxygen', class: 'Gases', quantityKg: 20, unNumber: 'UN1072' }]
};

export const medevac: FreelanceJob = {
  id: 7, kind: 'Medevac',
  origin: 'SBFL', originIata: 'FLN', originName: 'Hercílio Luz International Airport',
  destination: 'SBGR', destinationIata: 'GRU', destinationName: 'Guarulhos International Airport',
  distanceNm: 278, client: 'Hospital Santa Catarina',
  briefing: 'A burn patient needs an urgent transfer to a specialist unit in São Paulo.',
  legs: [florianopolisToGuarulhos],
  reward: 4500, expiresAtUtc: '2026-11-26T12:00:00Z', expired: false, aircraft: ['C208', 'PC12'], warnings: []
};

export const executiveTour: FreelanceJob = {
  ...medevac, id: 8, kind: 'Executive', client: 'Banco Atlântico', briefing: null,
  destination: 'SBFL', destinationIata: 'FLN', destinationName: 'Hercílio Luz International Airport', distanceNm: 834,
  legs: [
    { ...florianopolisToGuarulhos, passengerCount: 4, passengerNames: [], dangerousGoods: [], cargoKg: 80 },
    {
      ...florianopolisToGuarulhos, sequence: 2, origin: 'SBGR', originIata: 'GRU', originName: 'Guarulhos International Airport',
      destination: 'SBRJ', destinationIata: 'SDU', destinationName: 'Santos Dumont Airport', distanceNm: 196,
      passengerCount: 6, passengerNames: [], dangerousGoods: [], cargoKg: 120
    },
    {
      ...florianopolisToGuarulhos, sequence: 3, origin: 'SBRJ', originIata: 'SDU', originName: 'Santos Dumont Airport',
      destination: 'SBFL', destinationIata: 'FLN', destinationName: 'Hercílio Luz International Airport', distanceNm: 360,
      passengerCount: 4, passengerNames: [], dangerousGoods: [], cargoKg: 80
    }
  ],
  reward: 12000, aircraft: ['B738'],
  warnings: ['B738 needs 4,300 ft, SSKT longest runway is 2,500 ft']
};

export const pilotAtFlorianopolis: Pilot = {
  location: {
    code: 'SBFL', iataCode: 'FLN', name: 'Hercílio Luz International Airport', municipality: 'Florianópolis',
    countryCode: 'BR', latitude: -27.67, longitude: -48.55
  },
  flightHours: 0
};