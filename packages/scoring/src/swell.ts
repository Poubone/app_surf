import { distanceOutsideWindow } from './angles';
import type { Spot } from './types';

interface SwellInput {
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
}

function scorePeriod(period: number): number {
  if (period < 7) return 2;
  if (period < 10) return 12;
  if (period < 14) return 25;
  return 20;
}

function scoreHeight(
  height: number,
  min: number,
  max: number,
): number {
  if (height < 0.4) return 0;
  if (height >= min && height <= max) return 25;
  if (height > max) return 5;
  return 12; // below ideal but surfable
}

function swellDirectionMultiplier(
  direction: number,
  min: number,
  max: number,
): number {
  const outside = distanceOutsideWindow(direction, min, max);
  if (outside === 0) return 1.0;
  if (outside <= 20) return 0.5;
  return 0.0;
}

export function computeSwellScore(
  spot: Pick<Spot, 'swellAngleMin' | 'swellAngleMax' | 'idealSwellHeightMin' | 'idealSwellHeightMax'>,
  input: SwellInput,
): number {
  if (input.waveHeight < 0.4) return 0;

  const periodPts = scorePeriod(input.wavePeriod);
  const heightPts = scoreHeight(
    input.waveHeight,
    spot.idealSwellHeightMin,
    spot.idealSwellHeightMax,
  );
  const mult = swellDirectionMultiplier(
    input.waveDirection,
    spot.swellAngleMin,
    spot.swellAngleMax,
  );
  return (periodPts + heightPts) * mult;
}
