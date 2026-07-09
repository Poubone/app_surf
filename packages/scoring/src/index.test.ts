import { describe, it, expect } from 'vitest';
import { computeSurfScore } from './index';
import type { Spot } from './types';

const hendaye: Spot = {
  spotId: 'hendaye',
  name: 'Hendaye',
  slug: 'hendaye',
  latitude: 43.38,
  longitude: -1.77,
  beachOrientation: 20,
  swellAngleMin: 290,
  swellAngleMax: 320,
  windOffshoreMin: 130,
  windOffshoreMax: 180,
  idealSwellHeightMin: 0.8,
  idealSwellHeightMax: 1.8,
  tideOptimalStage: 'mid-rising',
};

describe('computeSurfScore', () => {
  it('Hendaye regression → 14 (displayed as 15)', () => {
    const result = computeSurfScore(hendaye, {
      waveHeight: 1.2,
      wavePeriod: 11,
      waveDirection: 270,
      windSpeedKnots: 14,
      windDirection: 310,
      tideStage: 'mid-rising',
    });
    expect(result.swellScore).toBe(25);
    expect(result.windScore).toBe(0);
    expect(result.tideScore).toBe(20);
    expect(result.windMalus).toBe(0.3);
    expect(result.total).toBe(14);
  });

  it('optimal conditions → ~100', () => {
    const result = computeSurfScore(hendaye, {
      waveHeight: 1.2,
      wavePeriod: 12,
      waveDirection: 300,
      windSpeedKnots: 3,
      windDirection: 155,
      tideStage: 'mid-rising',
    });
    expect(result.total).toBeGreaterThanOrEqual(95);
  });

  it('flat onshore → ~0', () => {
    const result = computeSurfScore(hendaye, {
      waveHeight: 0.2,
      wavePeriod: 5,
      waveDirection: 90,
      windSpeedKnots: 25,
      windDirection: 310,
      tideStage: 'high',
    });
    expect(result.total).toBe(0);
  });
});
