import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseWannasurf } from './wannasurf';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');

describe('parseWannasurf', () => {
  it('parses Hendaye characteristics', () => {
    const html = readFileSync(join(fixturesDir, 'wannasurf-hendaye.html'), 'utf-8');
    const r = parseWannasurf(html);
    expect(r.bottomType).toBeTruthy();
    expect(['low', 'mid-rising', 'mid-falling', 'high']).toContain(r.tideOptimalStage);
  });
});
