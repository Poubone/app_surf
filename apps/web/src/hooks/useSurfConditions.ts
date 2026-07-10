import { useCallback, useEffect, useState } from 'react';
import { computeSurfScore, type Spot, type ScoreBreakdown, type TideStage } from '@app-surf/scoring';
import { fetchMarineForecast, toHourlyConditions } from '../api/open-meteo';
import { hasSeaLevelData, tideStageFromSeaLevel } from '../api/tide';
import { loadSpots } from '../data/loadSpots';

export interface HourlyScore {
  time: string;
  score: ScoreBreakdown;
  conditions: {
    waveHeight: number;
    wavePeriod: number;
    waveDirection: number;
    windSpeedKnots: number;
    windDirection: number;
    tideStage: TideStage;
  };
}

export interface SpotConditions {
  spot: Spot;
  currentScore: ScoreBreakdown;
  hourlyScores: HourlyScore[];
  error?: string;
  tideUnavailable?: boolean;
}

export function useSurfConditions() {
  const [spots, setSpots] = useState<SpotConditions[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setNetworkError(false);
    try {
      const allSpots = await loadSpots();

      const results = await Promise.all(
        allSpots.map(async (spot) => {
          try {
            const forecast = await fetchMarineForecast(spot.latitude, spot.longitude);
            const { hourly } = forecast;
            const tideUnavailable = !hasSeaLevelData(hourly.sea_level_height_msl);

            const hourlyScores: HourlyScore[] = hourly.time.map((time, i) => {
              const base = toHourlyConditions(hourly, i);
              const at = new Date(time);
              const tideStage = tideUnavailable
                ? ('mid-rising' as TideStage)
                : tideStageFromSeaLevel(hourly.time, hourly.sea_level_height_msl, at);
              const conditions = { ...base, tideStage };
              const score = computeSurfScore(spot, conditions);
              if (tideUnavailable) {
                score.tideScore = 0;
                score.total = Math.round((score.swellScore + score.windScore) * score.windMalus);
              }
              return { time, score, conditions };
            });

            const now = new Date();
            const currentIdx = hourlyScores.findIndex((h) => new Date(h.time) >= now);
            const current = hourlyScores[Math.max(0, currentIdx)];
            return { spot, currentScore: current.score, hourlyScores, tideUnavailable };
          } catch (e) {
            return {
              spot,
              currentScore: {
                total: 0,
                swellScore: 0,
                windScore: 0,
                tideScore: 0,
                windMalus: 1,
                saturationMalus: 1,
                windLabel: 'Onshore' as const,
              },
              hourlyScores: [],
              error: String(e),
            };
          }
        }),
      );
      setSpots(results);
    } catch {
      setNetworkError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { spots, loading, networkError, refresh };
}
