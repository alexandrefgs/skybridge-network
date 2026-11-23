import { Airline, AirlineDetail, AirlineRoute } from '../core/airlines/airline.models';

export const gol: Airline = {
  id: 2579, name: 'Gol Transportes Aéreos', iataCode: 'G3', icaoCode: 'GLO', callsign: 'GOL TRANSPORTE',
  country: 'Brazil', isActive: true, routeCount: 293
};

export const golDetail: AirlineDetail = {
  ...gol,
  fleet: [
    { icaoCode: 'B738', manufacturer: 'Boeing', model: '737-800', category: 'Medium' },
    { icaoCode: 'B38M', manufacturer: 'Boeing', model: '737 MAX 8', category: 'Medium' }
  ],
  routesUpdatedAtUtc: '2026-11-23T01:05:00Z',
  routesSource: 'CGNA',
  routesEdition: '2026-11-19'
};

export const flnGru: AirlineRoute = {
  id: 10, origin: 'SBFL', originIata: 'FLN', originName: 'Hercílio Luz International Airport',
  destination: 'SBGR', destinationIata: 'GRU', destinationName: 'Guarulhos International Airport',
  distanceNm: 278, aircraft: ['B738', 'B38M'], atsRoute: 'UZ10 BUXUK', flightLevel: 330
};

export const page = <T>(items: T[], totalCount = items.length, pageSize = 15) => ({ items, page: 1, pageSize, totalCount });