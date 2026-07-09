import { describe, it, expect } from 'vitest';
import { computeSwellScore } from './swell';
import type { Spot } from './types';

const hendayeSpot: Pick<Spot,
  'swellAngleMin' | 'swellAngleMax' | 'idealSwellHeightMin' | 'idealSwellHeightMax'
> = {
  swellAngleMin: 290,
  swellAngleMax: 320,
  idealSwellHeightMin: 0.8,
  idealSwellHeightMax: 1.8,
};

describe('computeSwellScore', () => {
  it('scores Hendaye swell at 25 (270° is 20° outside window)', () => {
    const result = computeSwellScore(hendayeSpot, {
      waveHeight: 1.2,
      wavePeriod: 11,
      waveDirection: 270,
    });
    expect(result).toBe(25);
  });

  it('returns 0 for flat conditions', () => {
    const result = computeSwellScore(hendayeSpot, {
      waveHeight: 0.2,
      wavePeriod: 5,
      waveDirection: 300,
    });
    expect(result).toBe(0);
  });
});
