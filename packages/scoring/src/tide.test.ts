import { describe, it, expect } from 'vitest';
import { computeTideScore, computeTideStage } from './tide';

describe('computeTideStage', () => {
  const events = [
    { time: new Date('2026-07-09T06:00:00+02:00'), type: 'low' as const },
    { time: new Date('2026-07-09T12:30:00+02:00'), type: 'high' as const },
    { time: new Date('2026-07-09T18:45:00+02:00'), type: 'low' as const },
  ];

  it('returns low within 1h of BM', () => {
    const at = new Date('2026-07-09T06:30:00+02:00');
    expect(computeTideStage(at, events)).toBe('low');
  });

  it('returns mid-rising between BM and PM', () => {
    const at = new Date('2026-07-09T10:00:00+02:00');
    expect(computeTideStage(at, events)).toBe('mid-rising');
  });
});

describe('computeTideScore', () => {
  it('returns 20 for perfect match', () => {
    expect(computeTideScore('mid-rising', 'mid-rising')).toBe(20);
  });
  it('returns 10 for adjacent stage', () => {
    expect(computeTideScore('mid-rising', 'high')).toBe(10);
  });
  it('returns 2 for bad match', () => {
    expect(computeTideScore('low', 'high')).toBe(2);
  });
});
