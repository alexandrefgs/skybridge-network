import { Booking, FlightPlan } from '../core/bookings/booking.models';
import { Pirep } from '../core/pireps/pirep.models';
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
  reward: 4500, expiresAtUtc: '2026-11-26T12:00:00Z', expired: false, aircraft: ['C208', 'PC12'], warnings: [], taken: false
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
  flightHours: 0,
  flightMinutes: 0,
  balance: 0,
  simBriefPilotId: null
};

export const acceptedMedevac: Booking = {
  id: 31, status: 'Active', source: 'Freelance', aircraft: 'C208',
  currentLeg: 1, legCount: 1, legInProgress: false,
  bookedAtUtc: '2026-11-23T12:00:00Z', startDeadlineUtc: '2026-11-26T12:00:00Z',
  startedAtUtc: null, legStartedAtUtc: null, job: { ...medevac, taken: true },
    flightNumber: null, payPerHour: 0, flight: null, flightPlan: null
};

export const bookedGolFlight: Booking = {
  id: 40, status: 'Active', source: 'Airline', aircraft: 'B738',
  currentLeg: 1, legCount: 1, legInProgress: false,
  bookedAtUtc: '2026-11-23T12:00:00Z', startDeadlineUtc: '2026-11-24T12:00:00Z',
  startedAtUtc: null, legStartedAtUtc: null, job: null,
  flightNumber: 'GLO1042', payPerHour: 320,
  flight: {
    routeId: 42, flightNumber: 'GLO1042', airline: 'Gol Transportes Aéreos',
    origin: 'SBFL', originName: 'Hercílio Luz International Airport',
    destination: 'SBGR', destinationName: 'São Paulo/Guarulhos International Airport',
    distanceNm: 278, atsRoute: 'UZ6 PAKOT DCT', flightLevel: 360
  },
  flightPlan: null
};

export const golOfp: FlightPlan = {
  leg: 1, simBriefId: '98765432', generatedAtUtc: '2026-11-23T12:30:00Z', importedAtUtc: '2026-11-23T12:35:00Z', airac: '2611',
  origin: 'SBFL', destination: 'SBGR', alternate: 'SBKP', aircraft: 'B738', registration: 'PR-GXA', callsign: 'GLO1042',
  route: 'PAKOT UZ6 BUXUK', cruiseAltitudeFt: 36000, distanceNm: 285, enrouteMinutes: 62,
  blockFuelKg: 8000, takeoffFuelKg: 7800, landingFuelKg: 4600, tripFuelKg: 3200,
  passengerCount: 150, cargoKg: 2000, zeroFuelWeightKg: 60000, takeoffWeightKg: 67800, landingWeightKg: 64600
};

export const filedPirep: Pirep = {
  id: 51, bookingId: 31, pilot: 'Alexandre Fagundes', leg: 1, legCount: 1,
  origin: 'SBFL', destination: 'SBGR', aircraft: 'C208', distanceNm: 278,
  departedAtUtc: '2026-11-23T14:10:00Z', arrivedAtUtc: '2026-11-23T15:40:00Z', flightMinutes: 90,
  fuelUsedKg: 180, landingRateFpm: 160, remarks: null,
  status: 'Accepted', flag: null, reviewNote: null, filedAtUtc: '2026-11-23T15:45:00Z', reviewedAtUtc: null
};

export const medevacOfp: FlightPlan = { ...golOfp, aircraft: 'C208', registration: 'PR-MED', callsign: null, blockFuelKg: 600, landingFuelKg: 250 };

export const linkedPilot: Pilot = { ...pilotAtFlorianopolis, simBriefPilotId: '123456' };