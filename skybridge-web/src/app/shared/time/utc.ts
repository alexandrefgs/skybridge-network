const pad = (value: number) => String(value).padStart(2, '0');

export function toUtcInput(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function fromUtcInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function durationLabel(minutes: number): string {
  if (minutes <= 0) return '0min';
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h${pad(minutes % 60)}min` : `${minutes}min`;
}