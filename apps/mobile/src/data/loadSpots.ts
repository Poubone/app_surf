import type { Spot } from '@app-surf/scoring';
import spotsJson from '../../assets/spots.json';

export async function loadSpots(): Promise<Spot[]> {
  return spotsJson as Spot[];
}
