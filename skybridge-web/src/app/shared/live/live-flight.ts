import { LiveAirport, LiveFlight } from '../../core/public/public.models';
import { missionCode } from '../freelance/missions';

const EARTH_RADIUS_NM = 3440.065;

export function flightKey(flight: LiveFlight): string {
  return `${flight.network}-${flight.networkId}`;
}

export function distanceNm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function routeDistanceNm(flight: LiveFlight): number | null {
  return flight.origin && flight.destination ? Math.round(distanceNm(flight.origin, flight.destination)) : null;
}

export function remainingNm(flight: LiveFlight): number | null {
  return flight.destination ? Math.round(distanceNm(flight, flight.destination)) : null;
}

export function progress(flight: LiveFlight): number | null {
  if (!flight.origin || !flight.destination) return null;
  const flown = distanceNm(flight.origin, flight);
  const left = distanceNm(flight, flight.destination);
  if (flown + left === 0) return 0;
  return Math.min(1, Math.max(0, flown / (flown + left)));
}

export function altitudeLabel(feet: number): string {
  if (feet >= 18_000) return `FL${String(Math.round(feet / 100)).padStart(3, '0')}`;
  return `${Math.max(0, Math.round(feet / 10) * 10).toLocaleString('en-US')} ft`;
}

export function phaseLabel(flight: LiveFlight): string {
  if (flight.groundSpeedKt < 40) return 'On the ground';
  const done = progress(flight);
  if (done === null) return 'Airborne';
  if (done < 0.1) return 'Departure';
  if (done > 0.9) return 'Arrival';
  return 'En route';
}

export function missionTag(flight: LiveFlight): string | null {
  if (!flight.mission) return null;
  if (flight.mission === 'Airline') return flight.airline ? `AIRLINE · ${flight.airline.toUpperCase()}` : 'AIRLINE';
  return missionCode(flight.mission);
}

export function airportLabel(airport: LiveAirport | null): string {
  return airport?.code ?? '----';
}