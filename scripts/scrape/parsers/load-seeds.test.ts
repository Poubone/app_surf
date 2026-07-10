import { describe, it, expect } from 'vitest';
import { loadSeeds } from '../load-seeds.js';

describe('loadSeeds', () => {
  it('loads all catalog entries with overrides applied', () => {
    const seeds = loadSeeds();
    expect(seeds.length).toBeGreaterThan(400);
    const hendaye = seeds.find((s) => s.surfForecastSlug === 'Hendaye-Plage');
    expect(hendaye?.slug).toBe('hendaye');
    expect(hendaye?.name).toBe('Hendaye');
  });
});
