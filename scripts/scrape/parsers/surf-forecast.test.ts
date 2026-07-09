import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parseSurfForecast } from './surf-forecast';

describe('parseSurfForecast', () => {
  it('extracts swell and wind angle windows from Hendaye', () => {
    const html = readFileSync('fixtures/surf-forecast-hendaye.html', 'utf-8');
    const result = parseSurfForecast(html);
    expect(result.swellAngleMin).toBeGreaterThan(0);
    expect(result.swellAngleMax).toBeGreaterThan(result.swellAngleMin);
    expect(result.windOffshoreMin).toBeGreaterThan(0);
    expect(result.windOffshoreMax).toBeGreaterThan(0);
  });
});
