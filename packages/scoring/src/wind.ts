import { angleDiff } from './angles';
import type { ScoreBreakdown } from './types';

type WindLabel = ScoreBreakdown['windLabel'];

function offshoreCenter(min: number, max: number): number {
  if (min <= max) return (min + max) / 2;
  return ((min + max + 360) / 2) % 360;
}

export function computeWindScore(
  spot: { windOffshoreMin: number; windOffshoreMax: number },
  windSpeedKnots: number,
  windDirection: number,
): { score: number; label: WindLabel } {
  if (windSpeedKnots < 5) {
    return { score: 30, label: 'Glassy' };
  }
  const thetaOffshore = offshoreCenter(spot.windOffshoreMin, spot.windOffshoreMax);
  const delta = angleDiff(windDirection, thetaOffshore);

  if (delta <= 30) return { score: 30, label: 'Offshore' };
  if (delta <= 75) return { score: 15, label: 'Cross-shore' };
  return { score: 0, label: 'Onshore' };
}

export function computeWindMalus(label: WindLabel, windSpeedKnots: number): number {
  if (label !== 'Onshore') return 1.0;
  if (windSpeedKnots > 20) return 0.0;
  if (windSpeedKnots > 12) return 0.3;
  return 1.0;
}
