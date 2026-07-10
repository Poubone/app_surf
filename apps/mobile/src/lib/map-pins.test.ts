import { describe, expect, it } from 'vitest';
import { selectMapPins, toMapPin } from './map-pins';
import type { SpotView } from '../types';

function spot(overrides: Partial<SpotView> & { id: string }): SpotView {
  return {
    name: 'Test',
    region: 'R',
    department: '64',
    departmentName: 'Pyrénées-Atlantiques',
    latitude: 43.4,
    longitude: -1.6,
    hasScore: false,
    score: 0,
    waves: { height: 0, period: 0, direction: '—' },
    wind: { speed: 0, direction: '—', gust: 0 },
    water: { temp: 0 },
    tide: '—',
    weather: { temp: 0, condition: '—', emoji: '—' },
    weeklyScores: [],
    dayLabels: [],
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
    ...overrides,
  };
}

describe('selectMapPins', () => {
  const franceRegion = { latitude: 46.5, longitude: 2.5, latitudeDelta: 8, longitudeDelta: 8 };
  const localRegion = { latitude: 43.45, longitude: -1.62, latitudeDelta: 0.8, longitudeDelta: 0.8 };

  it('shows only scored pins at France zoom', () => {
    const pins = [
      toMapPin(spot({ id: 'a', hasScore: true, score: 70, latitude: 43.4, longitude: -1.6 })),
      toMapPin(spot({ id: 'b', hasScore: false, latitude: 43.5, longitude: -1.5 })),
    ];
    const visible = selectMapPins(pins, franceRegion);
    expect(visible).toHaveLength(1);
    expect(visible[0]?.id).toBe('a');
  });

  it('shows pins in viewport when zoomed in', () => {
    const pins = [
      toMapPin(spot({ id: 'near', latitude: 43.45, longitude: -1.62 })),
      toMapPin(spot({ id: 'far', latitude: 48.0, longitude: 2.0 })),
    ];
    const visible = selectMapPins(pins, localRegion);
    expect(visible.map((p) => p.id)).toContain('near');
    expect(visible.map((p) => p.id)).not.toContain('far');
  });
});
