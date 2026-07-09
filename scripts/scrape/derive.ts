import type { TideStage } from '@app-surf/scoring';

const HEIGHT_BY_LEVEL: Record<string, { min: number; max: number }> = {
  beginner: { min: 0.5, max: 1.2 },
  intermediate: { min: 0.8, max: 1.8 },
  advanced: { min: 1.2, max: 3.0 },
};

export function deriveBeachOrientation(swellAngleMin: number, swellAngleMax: number): number {
  const swellCenter = (swellAngleMin + swellAngleMax) / 2;
  return (swellCenter + 180) % 360;
}

export function deriveIdealHeight(level: string) {
  return HEIGHT_BY_LEVEL[level] ?? HEIGHT_BY_LEVEL.intermediate;
}

export function pickTideStage(...candidates: (TideStage | undefined)[]): TideStage {
  return (candidates.find(Boolean) as TideStage) ?? 'mid-rising';
}
