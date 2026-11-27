import { Booking, FlightPlan, FlightPlanDetails } from '../core/bookings/booking.models';
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
  simBriefPilotId: null,
  vatsimId: null,
  ivaoId: null
};

export const acceptedMedevac: Booking = {
  id: 31, status: 'Active', source: 'Freelance', aircraft: 'C208',
  currentLeg: 1, legCount: 1, legInProgress: false,
  bookedAtUtc: '2026-11-23T12:00:00Z', startDeadlineUtc: '2026-11-26T12:00:00Z',
  startedAtUtc: null, legStartedAtUtc: null, job: { ...medevac, taken: true },
    flightNumber: null, payPerHour: 0, flight: null, flightPlan: null, aircraftEngine: 'Turboprop'
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
  flightPlan: null,
  aircraftEngine: 'Jet'
};

export const golOfp: FlightPlan = {
  leg: 1, simBriefId: '98765432', generatedAtUtc: '2026-11-23T12:30:00Z', importedAtUtc: '2026-11-23T12:35:00Z', airac: '2611',
  origin: 'SBFL', destination: 'SBGR', alternate: 'SBKP', aircraft: 'B738', registration: 'PR-GXA', callsign: 'GLO1042',
  route: 'PAKOT UZ6 BUXUK', cruiseAltitudeFt: 36000, distanceNm: 285, enrouteMinutes: 62,
  blockFuelKg: 8000, takeoffFuelKg: 7800, landingFuelKg: 4600, tripFuelKg: 3200,
  passengerCount: 150, cargoKg: 2000, zeroFuelWeightKg: 60000, takeoffWeightKg: 67800, landingWeightKg: 64600,
  details: null
};

const fix = (ident: string, airway: string | null, stage: string, altitudeFt: number, elapsedMinutes: number, fuelOnboardKg: number, extra: object = {}) => ({
  ident, name: null, type: 'wpt', airway, stage, sidStar: false, altitudeFt, distanceNm: 40, trackMag: 52, windDirection: 290, windSpeedKts: 25,
  oatC: -40, groundSpeedKts: 440, elapsedMinutes, fuelUsedKg: 8000 - 200 - fuelOnboardKg, fuelOnboardKg, latitude: -27, longitude: -48, ...extra
});

export const golOfpDetails: FlightPlanDetails = {
  departure: { code: 'SBFL', name: 'Hercilio Luz', runway: '14', elevationFt: 16, transitionAltitudeFt: 7000, transitionLevelFt: 8000,
    metar: 'SBFL 241900Z 36010KT CAVOK 27/20 Q1012', taf: null },
  arrival: { code: 'SBGR', name: 'Guarulhos', runway: '10L', elevationFt: 2461, transitionAltitudeFt: 6000, transitionLevelFt: 7000,
    metar: 'SBGR 241900Z 10008KT 9999 FEW030 24/16 Q1015', taf: 'TAF SBGR 241700Z 2418/2524 10008KT 9999 FEW030' },
  alternate: { code: 'SBKP', name: 'Viracopos', runway: '15', distanceNm: 48, cruiseAltitudeFt: 15000, burnKg: 1200, enrouteMinutes: 18,
    route: 'DCT', metar: null },
  fuel: { taxiKg: 200, tripKg: 3200, contingencyKg: 160, alternateKg: 1200, reserveKg: 1100, extraKg: 140, minTakeoffKg: 5800,
    takeoffKg: 7800, blockKg: 8000, landingKg: 4600, averageFlowKgPerHour: 2600 },
  performance: { costIndex: '30', sid: 'PUN04A', star: 'BUXUK1A', stepClimbs: 'SBFL/0360', averageWindDirection: 290,
    averageWindSpeedKts: 25, averageWindComponentKts: -12, averageTempDeviation: 3, cruiseTasKts: 452, cruiseMach: '0.78',
    climbProfile: '250/280/78', cruiseProfile: 'CI 30', descentProfile: '78/280/250' },
  atcFlightPlan: '(FPL-GLO1042-IS\n-B738/M-SDE3FGHIRWY/LB1\n-SBFL2000\n-N0452F360 PAKOT UZ6 BUXUK\n-SBGR0102 SBKP)',
  navlog: [
    fix('PAKOT', 'PUN04A', 'CLB', 9000, 4, 7200, { sidStar: true, oatC: 4, groundSpeedKts: 300 }),
    fix('TOC', 'UZ6', 'CLB', 36000, 21, 6300, { name: 'TOP OF CLIMB', type: 'ltlg' }),
    fix('ENSUG', 'UZ6', 'CRZ', 36000, 38, 5500),
    fix('TOD', 'UZ6', 'CRZ', 36000, 46, 5100, { name: 'TOP OF DESCENT', type: 'ltlg' }),
    fix('BUXUK', 'BUXUK1A', 'DSC', 11000, 55, 4800, { sidStar: true, oatC: 8 }),
    fix('SBGR', null, 'DSC', 2461, 62, 4600, { name: 'GUARULHOS', type: 'apt', oatC: 24 })
  ]
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