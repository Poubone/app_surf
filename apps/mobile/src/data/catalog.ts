import catalogJson from '../../assets/france-catalog.json';

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
  return catalogJson as CatalogSpot[];
}
