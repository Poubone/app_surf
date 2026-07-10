/** Surf-Forecast region slug → département INSEE (filtre / actualisation). */
export const REGION_TO_DEPARTMENT: Record<string, { code: string; name: string }> = {
  'La-Cote-Basque': { code: '64', name: 'Pyrénées-Atlantiques' },
  Landes: { code: '40', name: 'Landes' },
  Gironde: { code: '33', name: 'Gironde' },
  'Charente-Maritime': { code: '17', name: 'Charente-Maritime' },
  Vendee: { code: '85', name: 'Vendée' },
  'Loire-Atlantique': { code: '44', name: 'Loire-Atlantique' },
  'Finistere-Brittany': { code: '29', name: 'Finistère' },
  'Cote-d-Armor-Brittany': { code: '22', name: "Côtes-d'Armor" },
  'Morbihan-Brittany': { code: '56', name: 'Morbihan' },
  'Ile-et-Vilaine-Brittany': { code: '35', name: 'Ille-et-Vilaine' },
  Normandy: { code: '14', name: 'Calvados' },
  'Nord-Pas-de-Calais': { code: '59', name: 'Nord' },
  Corsica: { code: '2A', name: 'Corse-du-Sud' },
  'Cote-d-Azur': { code: '83', name: 'Var' },
  'Languedoc-Roussillon': { code: '34', name: 'Hérault' },
};

export const DEPARTMENT_NAMES: Record<string, string> = Object.fromEntries(
  Object.values(REGION_TO_DEPARTMENT).map((d) => [d.code, d.name]),
);

/** Départements prioritaires (vagues de scrape). */
export const PRIORITY_DEPARTMENTS = ['64', '40', '33', '29', '56'] as const;

export function departmentForRegion(regionSlug: string): { code: string; name: string } {
  return REGION_TO_DEPARTMENT[regionSlug] ?? { code: '00', name: 'France' };
}
