import { describe, it, expect } from 'vitest';
import { isSurfDaylightHour, isSurfDaylightTime, pickCurrentDaylightIndex } from './daylight';

describe('daylight scoring', () => {
  it('excludes night hours', () => {
    expect(isSurfDaylightHour(0)).toBe(false);
    expect(isSurfDaylightHour(5)).toBe(false);
    expect(isSurfDaylightHour(21)).toBe(false);
    expect(isSurfDaylightHour(12)).toBe(true);
    expect(isSurfDaylightTime('2026-07-10T03:00')).toBe(false);
    expect(isSurfDaylightTime('2026-07-10T14:00')).toBe(true);
  });

  it('picks next daylight slot before dawn', () => {
    const times = ['2026-07-10T00:00', '2026-07-10T06:00', '2026-07-10T12:00'];
    const idx = pickCurrentDaylightIndex(times, new Date('2026-07-10T02:30'));
    expect(idx).toBe(1);
  });
});
