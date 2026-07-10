import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseBreakCoords } from '../discover-france.js';

const __dir = dirname(fileURLToPath(import.meta.url));

describe('parseBreakCoords', () => {
  it('parses lat/long from Hendaye fixture HTML', () => {
    const html = readFileSync(join(__dir, '../fixtures/surf-forecast-hendaye.html'), 'utf-8');
    const result = parseBreakCoords(html);
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(43.38, 1);
    expect(result!.lng).toBeCloseTo(-1.77, 1);
  });
});
