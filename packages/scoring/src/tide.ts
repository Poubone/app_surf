import type { TideStage } from './types';

export interface TideEvent {
  time: Date;
  type: 'low' | 'high';
}

const ONE_HOUR_MS = 60 * 60 * 1000;

const ADJACENT: Record<TideStage, TideStage[]> = {
  low: ['mid-rising', 'mid-falling'],
  high: ['mid-rising', 'mid-falling'],
  'mid-rising': ['low', 'high'],
  'mid-falling': ['low', 'high'],
};

export function computeTideStage(at: Date, events: TideEvent[]): TideStage {
  const sorted = [...events].sort((a, b) => a.time.getTime() - b.time.getTime());

  for (const event of sorted) {
    if (Math.abs(at.getTime() - event.time.getTime()) <= ONE_HOUR_MS) {
      return event.type;
    }
  }

  const before = sorted.filter((e) => e.time <= at);
  const after = sorted.filter((e) => e.time > at);
  const prev = before[before.length - 1];
  const next = after[0];

  if (!prev || !next) return 'mid-rising';

  if (prev.type === 'low' && next.type === 'high') return 'mid-rising';
  if (prev.type === 'high' && next.type === 'low') return 'mid-falling';

  return 'mid-rising';
}

export function computeTideScore(actual: TideStage, optimal: TideStage): number {
  if (actual === optimal) return 20;
  if (ADJACENT[optimal].includes(actual)) return 10;
  return 2;
}
