import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v5 as uuidv5 } from 'uuid';
import type { TideStage } from '@app-surf/scoring';
import { parseSurfForecast, type SurfForecastData } from './parsers/surf-forecast.js';
import type { WannasurfData } from './parsers/wannasurf.js';
import { parseSurfReport, type SurfReportData } from './parsers/surf-report.js';
import { deriveBeachOrientation, deriveIdealHeight, pickTideStage } from './derive.js';
import { loadSeeds, type SeedSpot } from './load-seeds.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '../..');
const dataDir = join(root, 'data');
mkdirSync(dataDir, { recursive: true });

/** UUID stable par spot (réécritures git minimales). */
const SPOT_ID_NAMESPACE = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const SCRAPE_CONCURRENCY = 8;

const SURF_REPORT_SLUG: Record<string, string> = {
  hendaye: 'hendaye-s1027',
  sokoa: 'socoa-s1221',
  guethary: 'avalanche-alcyons-guethary-s1216',
  parlementia: 'parlementia-bidart-s1026',
  bidart: 'bidart-s999',
  lafitenia: 'lafitenia-saint-jean-luz-s1218',
  'cote-des-basques': 'cote-basques-biarritz-s1093',
  'grande-plage-biarritz': 'biarritz-grande-plage-s998',
  marinella: 'marinella-anglet-s1207',
  'les-corsaires': 'les-corsaires-anglet-s1206',
  belharra: 'belharra-s997',
  ondres: 'ondres-s1200',
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DEFAULT_SF: SurfForecastData = {
  swellAngleMin: 247.5,
  swellAngleMax: 315,
  windOffshoreMin: 135,
  windOffshoreMax: 225,
};

const DEFAULT_WS: WannasurfData = {
  bottomType: 'sand',
  level: 'intermediate',
  tideOptimalStage: 'mid-rising',
};

const DEFAULT_SR: SurfReportData = {
  descriptionFr: '',
  tideOptimalStage: undefined,
};

function surfReportSlug(slug: string): string | null {
  return SURF_REPORT_SLUG[slug] ?? null;
}

function defaultDescription(seed: SeedSpot): string {
  return `${seed.name} — spot de surf en ${seed.departmentName}.`;
}

function stableSpotId(seed: SeedSpot): string {
  return uuidv5(seed.surfForecastSlug, SPOT_ID_NAMESPACE);
}

async function fetchText(url: string, label: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    if (!res.ok) {
      console.error(`[${label}] HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`[${label}] Failed ${url}:`, err);
    return null;
  }
}

function parseOrFallback<T>(
  label: string,
  html: string | null,
  parse: (h: string) => T,
  fallback: T,
): T {
  if (!html) return fallback;
  try {
    return parse(html);
  } catch (err) {
    console.error(`[${label}] Parse error:`, err);
    return fallback;
  }
}

interface ScrapedRow {
  spot_id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  beach_orientation: number;
  swell_angle_min: number;
  swell_angle_max: number;
  wind_offshore_min: number;
  wind_offshore_max: number;
  ideal_swell_height_min: number;
  ideal_swell_height_max: number;
  tide_optimal_stage: string;
  bottom_type: string | null;
  level: string | null;
  description_fr: string | null;
  webcam_url: string | null;
  webcam_provider: string | null;
  department: string;
  department_name: string;
  surf_forecast_slug: string;
}

async function scrapeSeed(seed: SeedSpot): Promise<ScrapedRow> {
  const sfSlug = seed.surfForecastSlug;
  const sfUrl = `https://www.surf-forecast.com/breaks/${sfSlug}`;
  const srSlug = surfReportSlug(seed.slug);
  const srUrl = srSlug ? `https://www.surf-report.com/surf-info/${srSlug}.html` : null;

  const [sfHtml, srHtml] = await Promise.all([
    fetchText(sfUrl, `${seed.slug}/surf-forecast`),
    srUrl ? fetchText(srUrl, `${seed.slug}/surf-report`) : Promise.resolve(null),
  ]);

  const sf = parseOrFallback(`${seed.slug}/surf-forecast`, sfHtml, parseSurfForecast, DEFAULT_SF);
  const ws = DEFAULT_WS;
  const sr = parseOrFallback(
    `${seed.slug}/surf-report`,
    srHtml,
    parseSurfReport,
    { ...DEFAULT_SR, descriptionFr: defaultDescription(seed) },
  );

  const heights = deriveIdealHeight(ws.level);
  const tideOptimalStage: TideStage = pickTideStage(sr.tideOptimalStage, ws.tideOptimalStage);

  return {
    spot_id: stableSpotId(seed),
    name: seed.name,
    slug: seed.slug,
    latitude: seed.latitude,
    longitude: seed.longitude,
    beach_orientation: deriveBeachOrientation(sf.swellAngleMin, sf.swellAngleMax),
    swell_angle_min: sf.swellAngleMin,
    swell_angle_max: sf.swellAngleMax,
    wind_offshore_min: sf.windOffshoreMin,
    wind_offshore_max: sf.windOffshoreMax,
    ideal_swell_height_min: heights.min,
    ideal_swell_height_max: heights.max,
    tide_optimal_stage: tideOptimalStage,
    bottom_type: ws.bottomType,
    level: ws.level,
    description_fr: sr.descriptionFr || defaultDescription(seed),
    webcam_url: sr.webcamUrl ?? null,
    webcam_provider: sr.webcamProvider ?? null,
    department: seed.department,
    department_name: seed.departmentName,
    surf_forecast_slug: sfSlug,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx], idx);
      done += 1;
      onProgress?.(done, items.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function main() {
  const seeds = loadSeeds();
  console.log(`Scraping ${seeds.length} spots from france-catalog.json…`);

  let lastLog = 0;
  const rows = await mapWithConcurrency(
    seeds,
    SCRAPE_CONCURRENCY,
    async (seed) => scrapeSeed(seed),
    (done, total) => {
      const now = Date.now();
      if (done === total || now - lastLog > 3000) {
        console.log(`  ${done}/${total}`);
        lastLog = now;
      }
    },
  );

  const db = new Database(join(dataDir, 'spots.db'));
  db.exec('DROP TABLE IF EXISTS spots');
  db.exec(`
    CREATE TABLE spots (
      spot_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      beach_orientation REAL NOT NULL,
      swell_angle_min REAL NOT NULL,
      swell_angle_max REAL NOT NULL,
      wind_offshore_min REAL NOT NULL,
      wind_offshore_max REAL NOT NULL,
      ideal_swell_height_min REAL NOT NULL,
      ideal_swell_height_max REAL NOT NULL,
      tide_optimal_stage TEXT NOT NULL,
      bottom_type TEXT,
      level TEXT,
      description_fr TEXT,
      webcam_url TEXT,
      webcam_provider TEXT,
      department TEXT NOT NULL,
      department_name TEXT NOT NULL,
      surf_forecast_slug TEXT
    );
  `);

  const insert = db.prepare(`
    INSERT INTO spots VALUES (
      @spot_id, @name, @slug, @latitude, @longitude,
      @beach_orientation, @swell_angle_min, @swell_angle_max,
      @wind_offshore_min, @wind_offshore_max,
      @ideal_swell_height_min, @ideal_swell_height_max,
      @tide_optimal_stage, @bottom_type, @level, @description_fr,
      @webcam_url, @webcam_provider,
      @department, @department_name, @surf_forecast_slug
    )
  `);

  const insertMany = db.transaction((batch: ScrapedRow[]) => {
    for (const row of batch) insert.run(row);
  });
  insertMany(rows);

  const spots = rows
    .map((row) => ({
      spotId: row.spot_id,
      name: row.name,
      slug: row.slug,
      department: row.department,
      departmentName: row.department_name,
      surfForecastSlug: row.surf_forecast_slug,
      latitude: row.latitude,
      longitude: row.longitude,
      beachOrientation: row.beach_orientation,
      swellAngleMin: row.swell_angle_min,
      swellAngleMax: row.swell_angle_max,
      windOffshoreMin: row.wind_offshore_min,
      windOffshoreMax: row.wind_offshore_max,
      idealSwellHeightMin: row.ideal_swell_height_min,
      idealSwellHeightMax: row.ideal_swell_height_max,
      tideOptimalStage: row.tide_optimal_stage,
      bottomType: row.bottom_type ?? undefined,
      level: row.level ?? undefined,
      descriptionFr: row.description_fr ?? undefined,
      ...(row.webcam_url
        ? { webcamUrl: row.webcam_url, webcamProvider: row.webcam_provider ?? undefined }
        : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  writeFileSync(join(dataDir, 'spots.json'), JSON.stringify(spots, null, 2));
  console.log(`Wrote ${spots.length} spots to data/spots.json`);
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
