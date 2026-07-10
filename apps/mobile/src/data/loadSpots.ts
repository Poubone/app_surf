import type { Spot } from '@app-surf/scoring';

let cache: Spot[] | null = null;

/** Chargement différé du gros JSON (évite pic mémoire au lancement). */
export async function loadSpots(): Promise<Spot[]> {
  if (cache) return cache;
  const mod = await import('../../assets/spots.json');
  cache = mod.default as Spot[];
  return cache;
}
