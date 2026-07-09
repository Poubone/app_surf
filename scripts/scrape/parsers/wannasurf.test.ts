import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parseWannasurf } from './wannasurf';

describe('parseWannasurf', () => {
  it('parses Hendaye characteristics', () => {
    const html = readFileSync('fixtures/wannasurf-hendaye.html', 'utf-8');
    const r = parseWannasurf(html);
    expect(r.bottomType).toBeTruthy();
    expect(['low', 'mid-rising', 'mid-falling', 'high']).toContain(r.tideOptimalStage);
  });
});
