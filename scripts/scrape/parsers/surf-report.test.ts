import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseSurfReport } from './surf-report';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');

describe('parseSurfReport', () => {
  it('parses Hendaye French description', () => {
    const html = readFileSync(join(fixturesDir, 'surf-report-hendaye.html'), 'utf-8');
    const r = parseSurfReport(html);
    expect(r.descriptionFr.length).toBeGreaterThan(50);
  });

  it('parses Hendaye webcam link from spot sub-nav', () => {
    const html = readFileSync(join(fixturesDir, 'surf-report-hendaye.html'), 'utf-8');
    const r = parseSurfReport(html);
    expect(r.webcamUrl).toBe('https://www.surf-report.com/webcams/hendaye-s1027.html');
    expect(r.webcamProvider).toBe('surf-report');
  });
});
