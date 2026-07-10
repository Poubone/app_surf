import type { ScoreBreakdown } from './types';

/** Créneaux surf de jour (alignés sur l'affichage 6h–20h). */
export const SURF_DAYLIGHT_HOUR_MIN = 6;
export const SURF_DAYLIGHT_HOUR_MAX = 20;

export function hourFromIso(isoTime: string): number {
  return Number(isoTime.slice(11, 13));
}

export function isSurfDaylightHour(hour: number): boolean {
  return hour >= SURF_DAYLIGHT_HOUR_MIN && hour <= SURF_DAYLIGHT_HOUR_MAX;
}

export function isSurfDaylightTime(isoTime: string): boolean {
  return isSurfDaylightHour(hourFromIso(isoTime));
}

export const NIGHT_SCORE: ScoreBreakdown = {
  swellScore: 0,
  windScore: 0,
  tideScore: 0,
  windMalus: 1,
  saturationMalus: 1,
  total: 0,
  windLabel: 'Offshore',
};

/** Index du créneau de jour le plus pertinent pour « maintenant ». */
export function pickCurrentDaylightIndex(times: string[], now = new Date()): number {
  if (times.length === 0) return 0;

  const candidates = times
    .map((time, i) => ({ time, i }))
    .filter(({ time }) => isSurfDaylightTime(time));
  if (candidates.length === 0) return 0;

  const future = candidates.find(({ time }) => new Date(time) >= now);
  if (future) return future.i;

  const past = [...candidates].reverse().find(({ time }) => new Date(time) <= now);
  if (past) return past.i;

  return candidates[0].i;
}
