import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parseSurfReport } from './surf-report';

describe('parseSurfReport', () => {
  it('parses Hendaye French description', () => {
    const html = readFileSync('fixtures/surf-report-hendaye.html', 'utf-8');
    const r = parseSurfReport(html);
    expect(r.descriptionFr.length).toBeGreaterThan(50);
  });
});
