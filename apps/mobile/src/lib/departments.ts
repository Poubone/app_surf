import type { CatalogSpot } from '../data/catalog';

export interface DepartmentOption {
  code: string;
  name: string;
  catalogCount: number;
  scrapedCount: number;
}

export function buildDepartmentOptions(
  catalog: CatalogSpot[],
  scrapedDepartments: Map<string, number>,
): DepartmentOption[] {
  const counts = new Map<string, { name: string; catalog: number; scraped: number }>();

  for (const spot of catalog) {
    const entry = counts.get(spot.department) ?? {
      name: spot.departmentName,
      catalog: 0,
      scraped: 0,
    };
    entry.catalog += 1;
    counts.set(spot.department, entry);
  }

  for (const [code, scraped] of scrapedDepartments) {
    const entry = counts.get(code) ?? { name: code, catalog: 0, scraped: 0 };
    entry.scraped = scraped;
    counts.set(code, entry);
  }

  return [...counts.entries()]
    .map(([code, v]) => ({
      code,
      name: v.name,
      catalogCount: v.catalog,
      scrapedCount: v.scraped,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function departmentLabel(code: string, name: string): string {
  return `${name} (${code})`;
}
