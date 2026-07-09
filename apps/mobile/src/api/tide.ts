import { computeTideStage, type TideEvent, type TideStage } from '@app-surf/scoring';

/** Derive high/low tide times from hourly sea level (Open-Meteo sea_level_height_msl). */
export function deriveTideEventsFromSeaLevel(
  times: string[],
  heights: (number | null)[],
): TideEvent[] {
  const events: TideEvent[] = [];

  for (let i = 1; i < heights.length - 1; i++) {
    const prev = heights[i - 1];
    const curr = heights[i];
    const next = heights[i + 1];
    if (prev == null || curr == null || next == null) continue;

    if (curr > prev && curr > next) {
      events.push({ time: new Date(times[i]), type: 'high' });
    } else if (curr < prev && curr < next) {
      events.push({ time: new Date(times[i]), type: 'low' });
    }
  }

  return events;
}

export function tideStageFromSeaLevel(
  times: string[],
  heights: (number | null)[],
  at: Date,
): TideStage {
  const events = deriveTideEventsFromSeaLevel(times, heights);
  if (events.length === 0) return 'mid-rising';
  return computeTideStage(at, events);
}

export function hasSeaLevelData(heights: (number | null)[]): boolean {
  return heights.some((h) => h != null);
}
