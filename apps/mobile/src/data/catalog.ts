let cache: CatalogSpot[] | null = null;

export interface CatalogSpot {
  surfForecastSlug: string;
  name: string;
  latitude: number;
  longitude: number;
  department: string;
  departmentName: string;
  regionSlug: string;
}

/** Chargement différé du catalogue (carte affichable avant le gros spots.json). */
export async function loadCatalog(): Promise<CatalogSpot[]> {
  if (cache) return cache;
  const mod = await import('../../assets/france-catalog.json');
  cache = mod.default as CatalogSpot[];
  return cache;
}
