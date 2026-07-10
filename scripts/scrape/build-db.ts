import Database from 'better-sqlite3';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import type { TideStage } from '@app-surf/scoring';
import { parseSurfForecast, type SurfForecastData } from './parsers/surf-forecast.js';
import type { WannasurfData } from './parsers/wannasurf.js';
import { parseSurfReport, type SurfReportData } from './parsers/surf-report.js';
import { deriveBeachOrientation, deriveIdealHeight, pickTideStage } from './derive.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '../..');
const dataDir = join(root, 'data');
mkdirSync(dataDir, { recursive: true });

interface SeedSpot {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  department: string;
  departmentName: string;
}

const SURF_FORECAST_SLUG: Record<string, string> = {
  hendaye: 'Hendaye-Plage',
  sokoa: 'Socoa',
  guethary: 'Cenitz',
  parlementia: 'Parlementia',
  bidart: 'Bidart',
  lafitenia: 'Lafitenia',
  'cote-des-basques': 'Cotedes-Basques',
  'grande-plage-biarritz': 'Grande-Plage',
  marinella: 'Anglet-Marinella',
  'les-corsaires': 'Anglet-Corsaires',
  belharra: 'Belharra',
  ondres: 'Ondres-Plage',
  'lacanau-ocean': 'Lacanau-Ocean',
  'hourtin-plage': 'Hourtin-Plage',
  'cap-ferret': 'Cap-Ferret',
  'carcans-plage': 'Carcans-Plage',
  'la-graviere': 'La-Graviere',
  'la-centrale': 'La-Centrale',
  'le-penon': 'Le-Penon',
  'capbreton-la-piste': 'La-Piste',
  'biscarrosse-plage': 'Biscarosse-Plage',
  'les-estagnots': 'Les-Estagnots',
  'la-torche': 'Pointdela-Torche',
  'baie-des-trepasses': 'Baiedes-Trepasses',
  'anse-de-lesconil': 'Ansede-Lesconil',
  'pen-hat': 'Anse-de-Pen-hat',
  'blancs-sablons': 'Blancs-Sablons',
  'guidel-plages': 'Guidel-Plages',
  etel: 'Etel',
  'les-donnants': 'Les-Donnants_Belle-Ile',
  'larmor-plage': 'Larmor-Plage',
};

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

function surfForecastSlug(slug: string): string {
  return SURF_FORECAST_SLUG[slug] ?? slug;
}

function surfReportSlug(slug: string): string | null {
  return SURF_REPORT_SLUG[slug] ?? null;
}

function defaultDescription(seed: SeedSpot): string {
  return `${seed.name} — spot de surf en ${seed.departmentName}.`;
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

const seeds: SeedSpot[] = JSON.parse(readFileSync(join(__dir, 'spots-seed.json'), 'utf-8'));

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
    department TEXT NOT NULL,
    department_name TEXT NOT NULL,
    surf_forecast_slug TEXT
  );
`);
db.exec('DELETE FROM spots');

const insert = db.prepare(`
  INSERT INTO spots VALUES (
    @spot_id, @name, @slug, @latitude, @longitude,
    @beach_orientation, @swell_angle_min, @swell_angle_max,
    @wind_offshore_min, @wind_offshore_max,
    @ideal_swell_height_min, @ideal_swell_height_max,
    @tide_optimal_stage, @bottom_type, @level, @description_fr,
    @department, @department_name, @surf_forecast_slug
  )
`);

for (const seed of seeds) {
  const sfSlug = surfForecastSlug(seed.slug);
  console.log(`Scraping ${seed.name}...`);

  const sfUrl = `https://www.surf-forecast.com/breaks/${sfSlug}`;
  const srSlug = surfReportSlug(seed.slug);
  const srUrl = srSlug ? `https://www.surf-report.com/surf-info/${srSlug}.html` : null;

  const [sfHtml, srHtml] = await Promise.all([
    fetchText(sfUrl, `${seed.slug}/surf-forecast`),
    srUrl ? fetchText(srUrl, `${seed.slug}/surf-report`) : Promise.resolve(null),
  ]);

  const sf = parseOrFallback(
    `${seed.slug}/surf-forecast`,
    sfHtml,
    parseSurfForecast,
    DEFAULT_SF,
  );
  const ws = DEFAULT_WS;
  const sr = parseOrFallback(
    `${seed.slug}/surf-report`,
    srHtml,
    parseSurfReport,
    { ...DEFAULT_SR, descriptionFr: defaultDescription(seed) },
  );

  const heights = deriveIdealHeight(ws.level);
  const tideOptimalStage: TideStage = pickTideStage(sr.tideOptimalStage, ws.tideOptimalStage);

  insert.run({
    spot_id: uuid(),
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
    department: seed.department,
    department_name: seed.departmentName,
    surf_forecast_slug: sfSlug,
  });
}

const rows = db.prepare('SELECT * FROM spots ORDER BY name').all() as Array<{
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
  department: string;
  department_name: string;
  surf_forecast_slug: string | null;
}>;

const spots = rows.map((row) => ({
  spotId: row.spot_id,
  name: row.name,
  slug: row.slug,
  department: row.department,
  departmentName: row.department_name,
  surfForecastSlug: row.surf_forecast_slug ?? undefined,
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
}));

writeFileSync(join(dataDir, 'spots.json'), JSON.stringify(spots, null, 2));
console.log(`Wrote ${spots.length} spots to data/spots.json`);
console.log(`Wrote ${spots.length} spots to data/spots.db`);
db.close();
