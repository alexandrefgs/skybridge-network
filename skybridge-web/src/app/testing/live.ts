import { LiveFlight, LiveMap } from '../core/public/public.models';

export const liveGol: LiveFlight = {
  network: 'VATSIM',
  networkId: 1234567,
  callsign: 'GLO1450',
  pilot: 'Alexandre F.',
  latitude: -27.25,
  longitude: -48.98,
  altitudeFt: 35012,
  groundSpeedKt: 448,
  heading: 218,
  aircraft: 'B738',
  aircraftModel: 'Boeing 737-800',
  mission: 'Airline',
  airline: 'Gol',
  origin: { code: 'SBGR', name: 'Guarulhos International Airport', latitude: -23.432, longitude: -46.469 },
  destination: { code: 'SBPA', name: 'Salgado Filho International Airport', latitude: -29.994, longitude: -51.171 }
};

export const liveMedevac: LiveFlight = {
  network: 'IVAO',
  networkId: 654321,
  callsign: 'SKB2190',
  pilot: 'Marina C.',
  latitude: -25.55,
  longitude: -51.4,
  altitudeFt: 9480,
  groundSpeedKt: 162,
  heading: 268,
  aircraft: 'C208',
  aircraftModel: 'Cessna 208 Caravan',
  mission: 'Medevac',
  airline: null,
  origin: { code: 'SBCT', name: 'Afonso Pena International Airport', latitude: -25.528, longitude: -49.176 },
  destination: { code: 'SBFI', name: 'Foz do Iguaçu International Airport', latitude: -25.6, longitude: -54.485 }
};

export const liveA320: LiveFlight = {
  network: 'VATSIM',
  networkId: 7654321,
  callsign: 'AZU4512',
  pilot: 'Rafael L.',
  latitude: -10.4,
  longitude: -38.1,
  altitudeFt: 37000,
  groundSpeedKt: 461,
  heading: 232,
  aircraft: 'A20N',
  aircraftModel: null,
  mission: null,
  airline: null,
  origin: { code: 'SBRF', name: 'Recife International Airport', latitude: -8.126, longitude: -34.923 },
  destination: { code: 'SBBR', name: 'Brasília International Airport', latitude: -15.869, longitude: -47.921 }
};

export const liveMap: LiveMap = {
  updatedAtUtc: '2026-11-27T14:58:12Z',
  vatsimAvailable: true,
  ivaoAvailable: true,
  flights: [liveA320, liveGol, liveMedevac]
};

export const emptyLiveMap: LiveMap = { updatedAtUtc: '2026-11-27T14:58:12Z', vatsimAvailable: true, ivaoAvailable: true, flights: [] };