import { useCallback, useEffect, useState } from 'react';
import { computeSurfScore, type Spot, type ScoreBreakdown, type TideStage } from '@app-surf/scoring';
import { fetchMarineForecast, toHourlyConditions } from '../api/open-meteo';
import { fetchWeatherForecast } from '../api/weather';
import { hasSeaLevelData, tideStageFromSeaLevel } from '../api/tide';
import { loadSpots } from '../data/loadSpots';
import {
  degreesToCompass,
  kmhToKnots,
  localDateKey,
  scoreToTen,
  weatherCodeToLabel,
} from '../lib/display';
import { formatTideLabel } from '../lib/tide-label';
import { DISPLAY_HOURS, type HourlyScoreRow, type SpotView } from '../types';

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

function pickIndexForHour(times: string[], hour: number, dayKey: string): number {
  const match = times.findIndex((t) => localDateKey(t) === dayKey && new Date(t).getHours() === hour);
  if (match >= 0) return match;
  return times.findIndex((t) => localDateKey(t) === dayKey);
}

function buildHourlyBars(hourlyScores: HourlyScore[], dayKey: string) {
  const { hourly } = { hourly: hourlyScores };
  const times = hourlyScores.map((h) => h.time);
  return DISPLAY_HOURS.map((hour) => {
    const idx = pickIndexForHour(times, hour, dayKey);
    const entry = hourlyScores[idx];
    if (!entry) return { hour: `${hour.toString().padStart(2, '0')}h`, score: 0, height: 0 };
    return {
      hour: `${hour.toString().padStart(2, '0')}h`,
      score: scoreToTen(entry.score.total),
      height: Math.round(entry.conditions.waveHeight * 10) / 10,
    };
  });
}

function buildWeeklyScores(hourlyScores: HourlyScore[], dailyTimes: string[]): number[] {
  const times = hourlyScores.map((h) => h.time);
  return dailyTimes.map((day) => {
    const noonIdx = pickIndexForHour(times, 12, day);
    const entry = hourlyScores[noonIdx];
    return entry ? scoreToTen(entry.score.total) : 1;
  });
}

async function buildSpotView(spot: Spot): Promise<SpotView> {
  const [marine, weather] = await Promise.all([
    fetchMarineForecast(spot.latitude, spot.longitude, 7),
    fetchWeatherForecast(spot.latitude, spot.longitude, 7),
  ]);

  const { hourly } = marine;
  const tideUnavailable = !hasSeaLevelData(hourly.sea_level_height_msl);
  const now = new Date();
  const todayKey = localDateKey(hourly.time[0] ?? now.toISOString());

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

  const currentIdx = hourlyScores.findIndex((h) => new Date(h.time) >= now);
  const current = hourlyScores[Math.max(0, currentIdx)];
  const weatherIdx = weather.hourly.time.indexOf(current.time);
  const wIdx = weatherIdx >= 0 ? weatherIdx : 0;

  const waveDir = degreesToCompass(current.conditions.waveDirection);
  const windDir = degreesToCompass(current.conditions.windDirection);
  const gustKnots = kmhToKnots(weather.hourly.wind_gusts_10m[wIdx] ?? 0);
  const airTemp = Math.round(weather.hourly.temperature_2m[wIdx] ?? weather.daily.temperature_2m_max[0] ?? 0);
  const waterTemp = Math.round(hourly.sea_surface_temperature[currentIdx] ?? hourly.sea_surface_temperature[0] ?? 0);
  const wx = weatherCodeToLabel(weather.hourly.weather_code[wIdx] ?? 0);

  return {
    id: spot.spotId,
    name: spot.name,
    region: 'Pays Basque',
    latitude: spot.latitude,
    longitude: spot.longitude,
    score: scoreToTen(current.score.total),
    waves: {
      height: Math.round(current.conditions.waveHeight * 10) / 10,
      period: Math.round(current.conditions.wavePeriod),
      direction: waveDir,
    },
    wind: {
      speed: Math.round(current.conditions.windSpeedKnots),
      direction: windDir,
      gust: gustKnots,
    },
    water: { temp: waterTemp || 18 },
    tide: tideUnavailable ? 'Indisponible' : formatTideLabel(hourly.time, hourly.sea_level_height_msl, now),
    weather: { temp: airTemp, condition: wx.condition, emoji: wx.emoji },
    weeklyScores: buildWeeklyScores(hourlyScores, weather.daily.time),
    hourly: buildHourlyBars(hourlyScores, todayKey),
    hourlyScoresFull: hourlyScores.map((h) => ({
      time: h.time,
      scoreTotal: h.score.total,
      waveHeight: h.conditions.waveHeight,
      wavePeriod: h.conditions.wavePeriod,
      waveDirection: h.conditions.waveDirection,
      windSpeedKnots: h.conditions.windSpeedKnots,
      windDirection: h.conditions.windDirection,
    })),
    dailyKeys: weather.daily.time,
  };
}

export function useSurfConditions() {
  const [spots, setSpots] = useState<SpotView[]>([]);
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
            return await buildSpotView(spot);
          } catch (e) {
            return {
              id: spot.spotId,
              name: spot.name,
              region: 'Pays Basque',
              latitude: spot.latitude,
              longitude: spot.longitude,
              score: 0,
              waves: { height: 0, period: 0, direction: '—' },
              wind: { speed: 0, direction: '—', gust: 0 },
              water: { temp: 0 },
              tide: '—',
              weather: { temp: 0, condition: '—', emoji: '—' },
              weeklyScores: [0, 0, 0, 0, 0, 0, 0],
              hourly: [],
              error: String(e),
            } satisfies SpotView;
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

export function spotForDay(spot: SpotView, dayIndex: number): SpotView {
  if (dayIndex === 0 || !spot.hourlyScoresFull?.length) {
    return { ...spot, score: spot.weeklyScores[dayIndex] ?? spot.score };
  }

  const dayStr = spot.dailyKeys?.[dayIndex];
  if (!dayStr) return { ...spot, score: spot.weeklyScores[dayIndex] ?? spot.score };

  const dayScores = spot.hourlyScoresFull.filter((h) => localDateKey(h.time) === dayStr);
  if (dayScores.length === 0) {
    return { ...spot, score: spot.weeklyScores[dayIndex] ?? spot.score };
  }

  const noon = dayScores.find((h) => new Date(h.time).getHours() === 12) ?? dayScores[Math.floor(dayScores.length / 2)];
  return {
    ...spot,
    score: spot.weeklyScores[dayIndex] ?? scoreToTen(noon.scoreTotal),
    hourly: buildHourlyBarsFromRows(spot.hourlyScoresFull, dayStr),
    waves: {
      height: Math.round(noon.waveHeight * 10) / 10,
      period: Math.round(noon.wavePeriod),
      direction: degreesToCompass(noon.waveDirection),
    },
    wind: {
      speed: Math.round(noon.windSpeedKnots),
      direction: degreesToCompass(noon.windDirection),
      gust: spot.wind.gust,
    },
  };
}

function buildHourlyBarsFromRows(rows: HourlyScoreRow[], dayKey: string) {
  const times = rows.map((h) => h.time);
  return DISPLAY_HOURS.map((hour) => {
    const idx = pickIndexForHour(times, hour, dayKey);
    const entry = rows[idx];
    if (!entry) return { hour: `${hour.toString().padStart(2, '0')}h`, score: 0, height: 0 };
    return {
      hour: `${hour.toString().padStart(2, '0')}h`,
      score: scoreToTen(entry.scoreTotal),
      height: Math.round(entry.waveHeight * 10) / 10,
    };
  });
}
