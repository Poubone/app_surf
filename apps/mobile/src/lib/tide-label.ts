import { tideStageFromSeaLevel } from '../api/tide';
import { deriveTideEventsFromSeaLevel } from '../api/tide';

export function formatTideLabel(
  times: string[],
  heights: (number | null)[],
  at: Date,
): string {
  const stage = tideStageFromSeaLevel(times, heights, at);
  const rising = stage === 'low' || stage === 'mid-rising';
  const trend = rising ? 'Montante' : 'Descendante';

  const events = deriveTideEventsFromSeaLevel(times, heights);
  const now = at.getTime();
  const next = events.find((e) => e.time.getTime() >= now) ?? events[0];
  if (!next) return trend;

  const h = next.time.getHours().toString().padStart(2, '0');
  const m = next.time.getMinutes().toString().padStart(2, '0');
  const timeLabel = m === '00' ? `${h}h` : `${h}h${m}`;
  return `${trend} · ${timeLabel}`;
}
