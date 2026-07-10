import { computeSwellScore } from './swell';
import { computeWindScore, computeWindMalus } from './wind';
import { computeTideScore } from './tide';
import type { Spot, HourlyConditions, ScoreBreakdown } from './types';

export { computeTideStage } from './tide';
export {
  hourFromIso,
  isSurfDaylightHour,
  isSurfDaylightTime,
  NIGHT_SCORE,
  pickCurrentDaylightIndex,
  SURF_DAYLIGHT_HOUR_MAX,
  SURF_DAYLIGHT_HOUR_MIN,
} from './daylight';
export type { Spot, HourlyConditions, ScoreBreakdown, TideStage } from './types';
export type { TideEvent } from './tide';

export function computeSurfScore(
  spot: Spot,
  conditions: HourlyConditions,
): ScoreBreakdown {
  const swellScore = computeSwellScore(spot, conditions);
  const { score: windScore, label: windLabel } = computeWindScore(
    spot,
    conditions.windSpeedKnots,
    conditions.windDirection,
  );
  const tideScore = computeTideScore(conditions.tideStage, spot.tideOptimalStage);
  const windMalus = computeWindMalus(windLabel, conditions.windSpeedKnots);
  const saturationMalus = 1.0;

  const raw = swellScore + windScore + tideScore;
  const total = Math.round(raw * windMalus * saturationMalus);

  return {
    swellScore,
    windScore,
    tideScore,
    windMalus,
    saturationMalus,
    total,
    windLabel,
  };
}
