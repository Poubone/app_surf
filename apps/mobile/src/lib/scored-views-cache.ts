import type { SpotView } from '../types';
import { getJsonItem, setJsonItem } from './storage';

export const SCORED_VIEWS_STORAGE_KEY = 'surfscore-spot-views-v1';

type StoredViews = Record<string, SpotView>;

export async function loadScoredViewsFromStorage(): Promise<Map<string, SpotView>> {
  const obj = await getJsonItem<StoredViews>(SCORED_VIEWS_STORAGE_KEY, {});
  return new Map(Object.entries(obj));
}

export async function saveScoredViewsToStorage(views: Map<string, SpotView>): Promise<void> {
  const merged = await getJsonItem<StoredViews>(SCORED_VIEWS_STORAGE_KEY, {});
  for (const [id, view] of views) merged[id] = view;
  await setJsonItem(SCORED_VIEWS_STORAGE_KEY, merged);
}
