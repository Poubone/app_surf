import type { Spot } from '@app-surf/scoring';

export async function loadSpots(): Promise<Spot[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}spots.json`);
  if (!res.ok) throw new Error(`Failed to load spots: ${res.status}`);
  return res.json();
}
