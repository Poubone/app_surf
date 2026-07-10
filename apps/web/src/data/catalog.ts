export interface CatalogSpot {
  surfForecastSlug: string;
  name: string;
  latitude: number;
  longitude: number;
  department: string;
  departmentName: string;
  regionSlug: string;
}

export async function loadCatalog(): Promise<CatalogSpot[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}france-catalog.json`);
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`);
  return res.json();
}
