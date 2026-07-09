import { describe, it, expect } from 'vitest';
import { computeWindScore, computeWindMalus } from './wind';

const hendayeWind = {
  windOffshoreMin: 130,
  windOffshoreMax: 180,
};

describe('computeWindScore', () => {
  it('returns 30 for glassy (<5 kn)', () => {
    expect(computeWindScore(hendayeWind, 3, 310)).toEqual({ score: 30, label: 'Glassy' });
  });

  it('returns 0 for onshore Hendaye (310° vs offshore ~155°)', () => {
    expect(computeWindScore(hendayeWind, 14, 310)).toEqual({ score: 0, label: 'Onshore' });
  });
});

describe('computeWindMalus', () => {
  it('applies 0.3 malus for onshore >12 kn', () => {
    expect(computeWindMalus('Onshore', 14)).toBe(0.3);
  });
  it('applies 0.0 malus for onshore >20 kn', () => {
    expect(computeWindMalus('Onshore', 22)).toBe(0.0);
  });
  it('returns 1.0 otherwise', () => {
    expect(computeWindMalus('Offshore', 14)).toBe(1.0);
  });
});
