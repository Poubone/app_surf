import type { SpotView } from '../types';

export const SCORED_VIEWS_STORAGE_KEY = 'surfscore-spot-views-v1';

export function loadScoredViewsFromStorage(): Map<string, SpotView> {
  try {
    const raw = localStorage.getItem(SCORED_VIEWS_STORAGE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, SpotView>;
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

export function saveScoredViewsToStorage(views: Map<string, SpotView>): void {
  try {
    const merged = loadScoredViewsFromStorage();
    for (const [id, view] of views) merged.set(id, view);
    localStorage.setItem(SCORED_VIEWS_STORAGE_KEY, JSON.stringify(Object.fromEntries(merged)));
  } catch {
    /* quota / private mode */
  }
}
