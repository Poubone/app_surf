import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { departmentForRegion } from './departments.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '../..');
const dataDir = join(root, 'data');
mkdirSync(dataDir, { recursive: true });

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface CatalogEntry {
  surfForecastSlug: string;
  name: string;
  latitude: number;
  longitude: number;
  department: string;
  departmentName: string;
  regionSlug: string;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractBreakSlugs(html: string): string[] {
  const slugs = new Set<string>();
  const re = /href="\/breaks\/([A-Za-z0-9_-]+)(?:\/[^"]*)?"/g;
  for (const m of html.matchAll(re)) {
    const slug = m[1];
    if (!slug.startsWith('nearest')) slugs.add(slug);
  }
  return [...slugs];
}

function extractRegionSlugs(html: string): string[] {
  const slugs = new Set<string>();
  const re = /href="\/regions\/([^"]+)"/g;
  for (const m of html.matchAll(re)) slugs.add(m[1]);
  return [...slugs];
}

export function parseBreakCoords(html: string): { lat: number; lng: number; name: string } | null {
  const $ = cheerio.load(html);
  const latTitle = $('.latitude').attr('title');
  const lngTitle = $('.longitude').attr('title');
  const name = $('h1.location-subheader-header__header').first().text().replace(/\s*Surf Guide\s*$/, '').trim();
  if (!latTitle || !lngTitle) return null;
  const lat = parseFloat(latTitle);
  const lng = parseFloat(lngTitle);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng, name: name || 'Spot' };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function main() {
  console.log('Fetching France regions…');
  const franceHtml = await fetchText('https://www.surf-forecast.com/countries/France/breaks');
  if (!franceHtml) throw new Error('Failed to fetch France breaks page');

  const regionSlugs = extractRegionSlugs(franceHtml);
  console.log(`Found ${regionSlugs.length} regions`);

  const slugToRegion = new Map<string, string>();
  for (const regionSlug of regionSlugs) {
    const html = await fetchText(`https://www.surf-forecast.com/regions/${regionSlug}`);
    if (!html) continue;
    for (const slug of extractBreakSlugs(html)) {
      if (!slugToRegion.has(slug)) slugToRegion.set(slug, regionSlug);
    }
    console.log(`  ${regionSlug}: ${extractBreakSlugs(html).length} breaks`);
  }

  const allSlugs = [...slugToRegion.keys()];
  console.log(`Fetching coordinates for ${allSlugs.length} breaks…`);

  const entries: CatalogEntry[] = [];
  await mapWithConcurrency(allSlugs, 6, async (sfSlug) => {
    const regionSlug = slugToRegion.get(sfSlug)!;
    const dept = departmentForRegion(regionSlug);
    const html = await fetchText(`https://www.surf-forecast.com/breaks/${sfSlug}`);
    const coords = html ? parseBreakCoords(html) : null;
    if (!coords) {
      console.warn(`  skip ${sfSlug}: no coordinates`);
      return;
    }
    entries.push({
      surfForecastSlug: sfSlug,
      name: coords.name,
      latitude: coords.lat,
      longitude: coords.lng,
      department: dept.code,
      departmentName: dept.name,
      regionSlug,
    });
  });

  entries.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const outPath = join(dataDir, 'france-catalog.json');
  writeFileSync(outPath, JSON.stringify(entries, null, 2));
  console.log(`Wrote ${entries.length} entries to ${outPath}`);
}

if (process.argv[1]?.endsWith('discover-france.ts') || process.argv[1]?.includes('discover-france')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
