import { durationLabel, fromUtcInput, toUtcInput } from './utc';

describe('utc helpers', () => {
  it('formats a date as a UTC input value and reads it back', () => {
    const value = toUtcInput(new Date('2026-11-23T08:05:00Z'));

    expect(value).toBe('2026-11-23T08:05');
    expect(fromUtcInput(value)).toBe('2026-11-23T08:05:00.000Z');
  });

  it('rejects incomplete values', () => {
    expect(fromUtcInput('')).toBeNull();
    expect(fromUtcInput('2026-11-23')).toBeNull();
  });

  it('labels durations', () => {
    expect(durationLabel(140)).toBe('2h20min');
    expect(durationLabel(90)).toBe('1h30min');
    expect(durationLabel(65)).toBe('1h05min');
    expect(durationLabel(45)).toBe('45min');
    expect(durationLabel(0)).toBe('0min');
  });
});