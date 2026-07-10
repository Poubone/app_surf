import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SpotView } from '../types';
import { loadScoredViewsFromStorage, saveScoredViewsToStorage, SCORED_VIEWS_STORAGE_KEY } from './scored-views-cache';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  });
});

function minimalView(id: string): SpotView {
  return {
    id,
    name: 'Test',
    region: '64',
    department: '64',
    departmentName: 'Pyrénées-Atlantiques',
    latitude: 43,
    longitude: -1,
    hasScore: true,
    score: 50,
    waves: { height: 1, period: 8, direction: 'O' },
    wind: { speed: 5, direction: 'E', gust: 8 },
    water: { temp: 18 },
    tide: '—',
    weather: { temp: 20, condition: 'Soleil', emoji: '☀️' },
    weeklyScores: [50],
    dayLabels: ['Auj.'],
    hourly: [],
    scoringConfig: {
      beachOrientation: 0,
      swellAngleMin: 0,
      swellAngleMax: 0,
      windOffshoreMin: 0,
      windOffshoreMax: 0,
      idealSwellHeightMin: 0,
      idealSwellHeightMax: 0,
      tideOptimalStage: 'mid-rising',
    },
  };
}

describe('scored-views-cache', () => {
  it('persists and reloads scored views', () => {
    const views = new Map([['a', minimalView('a')]]);
    saveScoredViewsToStorage(views);
    const loaded = loadScoredViewsFromStorage();
    expect(loaded.get('a')?.name).toBe('Test');
  });

  it('merges new views with existing cache', () => {
    saveScoredViewsToStorage(new Map([['a', minimalView('a')]]));
    saveScoredViewsToStorage(new Map([['b', minimalView('b')]]));
    const loaded = loadScoredViewsFromStorage();
    expect(loaded.size).toBe(2);
  });
});
