import { DangerousGoodClass, FreelanceJob, FreelanceJobKind } from '../../core/freelance/freelance.models';

export const MISSION_KINDS: { value: FreelanceJobKind; label: string }[] = [
  { value: 'Passengers', label: 'Passengers' },
  { value: 'Cargo', label: 'Cargo' },
  { value: 'Charter', label: 'Charter' },
  { value: 'Executive', label: 'Executive' },
  { value: 'Medevac', label: 'MEDEVAC' },
  { value: 'Repatriation', label: 'Repatriation' },
  { value: 'Humanitarian', label: 'Humanitarian' },
  { value: 'Ferry', label: 'Ferry' },
  { value: 'OrganTransport', label: 'Organ transport' },
  { value: 'AirTaxi', label: 'Air taxi' },
  { value: 'SportsTeam', label: 'Sports team' },
  { value: 'Skydiving', label: 'Skydiving' }
];

export const HAZARD_CLASSES: { value: DangerousGoodClass; code: number; label: string }[] = [
  { value: 'Explosives', code: 1, label: 'Explosives' },
  { value: 'Gases', code: 2, label: 'Gases' },
  { value: 'FlammableLiquids', code: 3, label: 'Flammable liquids' },
  { value: 'FlammableSolids', code: 4, label: 'Flammable solids' },
  { value: 'Oxidizers', code: 5, label: 'Oxidizers' },
  { value: 'Toxic', code: 6, label: 'Toxic and infectious' },
  { value: 'Radioactive', code: 7, label: 'Radioactive' },
  { value: 'Corrosives', code: 8, label: 'Corrosives' },
  { value: 'Miscellaneous', code: 9, label: 'Miscellaneous' }
];

export function missionLabel(kind: FreelanceJobKind): string {
  return MISSION_KINDS.find(k => k.value === kind)?.label ?? kind;
}

const MISSION_CODES: Record<string, string> = {
  Passengers: 'PAX',
  Cargo: 'CARGO',
  Charter: 'CHARTER',
  Executive: 'EXEC',
  Medevac: 'MEDEVAC',
  Repatriation: 'REPAT',
  Humanitarian: 'HUMANITAR',
  Ferry: 'FERRY',
  OrganTransport: 'ORGAN',
  AirTaxi: 'AIR TAXI',
  SportsTeam: 'SPORTS',
  Skydiving: 'SKYDIVING'
};

export function missionCode(kind: string | null): string {
  return (kind && MISSION_CODES[kind]) || 'FREELANCE';
}

export function hazardLabel(hazard: DangerousGoodClass): string {
  const entry = HAZARD_CLASSES.find(h => h.value === hazard);
  return entry ? `Class ${entry.code} · ${entry.label}` : hazard;
}

export function expiresIn(expiresAtUtc: string, now = Date.now()): string {
  const minutes = Math.floor((new Date(expiresAtUtc).getTime() - now) / 60000);
  if (minutes <= 0) return 'Expired';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes % 60}m`;
}

export function routeOf(job: FreelanceJob): string {
  return [job.legs[0]?.origin ?? job.origin, ...job.legs.map(leg => leg.destination)].join(' → ');
}

export function hasDangerousGoods(job: FreelanceJob): boolean {
  return job.legs.some(leg => leg.dangerousGoods.length > 0);
}

export function maxPassengers(job: FreelanceJob): number {
  return Math.max(0, ...job.legs.map(leg => leg.passengerCount));
}

export function maxCargo(job: FreelanceJob): number {
  return Math.max(0, ...job.legs.map(leg => leg.cargoKg));
}