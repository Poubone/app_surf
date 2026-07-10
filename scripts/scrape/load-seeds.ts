import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '../..');

export interface CatalogEntry {
  surfForecastSlug: string;
  name: string;
  latitude: number;
  longitude: number;
  department: string;
  departmentName: string;
  regionSlug: string;
}

export interface SeedSpot {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  department: string;
  departmentName: string;
  surfForecastSlug: string;
}

export interface SeedOverride {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  department: string;
  departmentName: string;
  surfForecastSlug: string;
}

function slugify(surfForecastSlug: string): string {
  return surfForecastSlug
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Catalogue France + overrides manuels (spots-seed.json) par surfForecastSlug. */
export function loadSeeds(): SeedSpot[] {
  const catalogPath = join(root, 'data/france-catalog.json');
  const overridesPath = join(__dir, 'spots-seed.json');

  const catalog: CatalogEntry[] = JSON.parse(readFileSync(catalogPath, 'utf-8'));
  const overrides: SeedOverride[] = JSON.parse(readFileSync(overridesPath, 'utf-8'));

  const overrideBySf = new Map(overrides.map((o) => [o.surfForecastSlug, o]));

  return catalog.map((entry) => {
    const override = overrideBySf.get(entry.surfForecastSlug);
    if (override) {
      return {
        slug: override.slug,
        name: override.name,
        latitude: override.latitude,
        longitude: override.longitude,
        department: override.department,
        departmentName: override.departmentName,
        surfForecastSlug: entry.surfForecastSlug,
      };
    }
    return {
      slug: slugify(entry.surfForecastSlug),
      name: entry.name,
      latitude: entry.latitude,
      longitude: entry.longitude,
      department: entry.department,
      departmentName: entry.departmentName,
      surfForecastSlug: entry.surfForecastSlug,
    };
  });
}
