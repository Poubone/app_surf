import { useCallback, useEffect, useState } from 'react';
import { computeSurfScore, type Spot, type ScoreBreakdown, type TideStage } from '@app-surf/scoring';
import { fetchMarineForecast, toMarineWaveConditions, type MarineForecast } from '../api/open-meteo';
import { fetchWeatherForecast, type WeatherForecast } from '../api/weather';
import { hasSeaLevelData, tideStageFromSeaLevel } from '../api/tide';
import { loadSpots } from '../data/loadSpots';
import { dayLabelsFromDates, hourFromIso } from '../lib/days';
import { degreesToCompass, kmhToKnots, localDateKey, weatherCodeToLabel } from '../lib/display';
import { formatTideLabel } from '../lib/tide-label';
import { DISPLAY_HOURS, type HourlyScoreRow, type SpotScoringConfig, type SpotView } from '../types';

function spotScoringConfig(spot: Spot): SpotScoringConfig {
  return {
    beachOrientation: spot.beachOrientation,
    swellAngleMin: spot.swellAngleMin,
    swellAngleMax: spot.swellAngleMax,
    windOffshoreMin: spot.windOffshoreMin,
    windOffshoreMax: spot.windOffshoreMax,
    idealSwellHeightMin: spot.idealSwellHeightMin,
    idealSwellHeightMax: spot.idealSwellHeightMax,
    tideOptimalStage: spot.tideOptimalStage,
    bottomType: spot.bottomType,
    level: spot.level,
  };
}

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

function weatherIndex(weather: WeatherForecast, marineTime: string): number {
  return weather.hourly.time.indexOf(marineTime);
}

function pickIndexForHour(times: string[], hour: number, dayKey: string): number {
  const match = times.findIndex((t) => localDateKey(t) === dayKey && hourFromIso(t) === hour);
  if (match >= 0) return match;
  return times.findIndex((t) => localDateKey(t) === dayKey);
}

function windFromWeather(weather: WeatherForecast, marineTime: string) {
  const idx = weatherIndex(weather, marineTime);
  if (idx < 0) return { windSpeedKnots: 0, windDirection: 0, gustKnots: 0 };
  return {
    windSpeedKnots: kmhToKnots(weather.hourly.wind_speed_10m[idx] ?? 0),
    windDirection: weather.hourly.wind_direction_10m[idx] ?? 0,
    gustKnots: kmhToKnots(weather.hourly.wind_gusts_10m[idx] ?? 0),
  };
}

function buildHourlyBars(rows: HourlyScoreRow[], dayKey: string) {
  const times = rows.map((h) => h.time);
  return DISPLAY_HOURS.map((hour) => {
    const idx = pickIndexForHour(times, hour, dayKey);
    const entry = rows[idx];
    if (!entry) return { hour: `${hour.toString().padStart(2, '0')}h`, score: 0, height: 0 };
    return {
      hour: `${hour.toString().padStart(2, '0')}h`,
      score: entry.scoreTotal,
      height: Math.round(entry.waveHeight * 10) / 10,
    };
  });
}

function buildWeeklyScores(rows: HourlyScoreRow[], dailyTimes: string[]): number[] {
  const times = rows.map((h) => h.time);
  return dailyTimes.map((day) => {
    const noonIdx = pickIndexForHour(times, 12, day);
    const entry = rows[noonIdx];
    return entry ? entry.scoreTotal : 0;
  });
}

function rowFromIndex(
  marine: MarineForecast,
  weather: WeatherForecast,
  hourlyScores: HourlyScore[],
  i: number,
): HourlyScoreRow {
  const time = marine.hourly.time[i];
  const wind = windFromWeather(weather, time);
  const wIdx = weatherIndex(weather, time);
  const h = hourlyScores[i];
  return {
    time,
    scoreTotal: h.score.total,
    waveHeight: h.conditions.waveHeight,
    wavePeriod: h.conditions.wavePeriod,
    waveDirection: h.conditions.waveDirection,
    windSpeedKnots: h.conditions.windSpeedKnots,
    windDirection: h.conditions.windDirection,
    windGustKnots: wind.gustKnots,
    airTemp: Math.round(weather.hourly.temperature_2m[wIdx] ?? 0),
    weatherCode: weather.hourly.weather_code[wIdx] ?? 0,
    waterTemp: marine.hourly.sea_surface_temperature[i],
    tideStage: h.conditions.tideStage,
    scoreBreakdown: {
      swellScore: h.score.swellScore,
      windScore: h.score.windScore,
      tideScore: h.score.tideScore,
      windMalus: h.score.windMalus,
      windLabel: h.score.windLabel,
    },
  };
}

async function buildSpotView(spot: Spot): Promise<SpotView> {
  const [marine, weather] = await Promise.all([
    fetchMarineForecast(spot.latitude, spot.longitude, 7),
    fetchWeatherForecast(spot.latitude, spot.longitude, 7),
  ]);

  const { hourly } = marine;
  const tideUnavailable = !hasSeaLevelData(hourly.sea_level_height_msl);
  const now = new Date();
  const todayKey = weather.daily.time[0] ?? localDateKey(hourly.time[0] ?? '');

  const hourlyScores: HourlyScore[] = hourly.time.map((time, i) => {
    const waves = toMarineWaveConditions(hourly, i);
    const wind = windFromWeather(weather, time);
    const at = new Date(time);
    const tideStage = tideUnavailable
      ? ('mid-rising' as TideStage)
      : tideStageFromSeaLevel(hourly.time, hourly.sea_level_height_msl, at);
    const conditions = {
      ...waves,
      windSpeedKnots: wind.windSpeedKnots,
      windDirection: wind.windDirection,
      tideStage,
    };
    const score = computeSurfScore(spot, conditions);
    if (tideUnavailable) {
      score.tideScore = 0;
      score.total = Math.round((score.swellScore + score.windScore) * score.windMalus);
    }
    return { time, score, conditions };
  });

  const rows = hourly.time.map((_, i) => rowFromIndex(marine, weather, hourlyScores, i));

  const currentIdx = hourlyScores.findIndex((h) => new Date(h.time) >= now);
  const idx = Math.max(0, currentIdx);
  const current = rows[idx];
  const wx = weatherCodeToLabel(current.weatherCode);

  return {
    id: spot.spotId,
    name: spot.name,
    region: 'Pays Basque',
    latitude: spot.latitude,
    longitude: spot.longitude,
    score: current.scoreTotal,
    waves: {
      height: Math.round(current.waveHeight * 10) / 10,
      period: Math.round(current.wavePeriod),
      direction: degreesToCompass(current.waveDirection),
    },
    wind: {
      speed: Math.round(current.windSpeedKnots),
      direction: degreesToCompass(current.windDirection),
      gust: current.windGustKnots,
    },
    water: { temp: Math.round(current.waterTemp ?? 18) },
    tide: tideUnavailable
      ? 'Indisponible'
      : formatTideLabel(hourly.time, hourly.sea_level_height_msl, now),
    weather: { temp: current.airTemp, condition: wx.condition, emoji: wx.emoji },
    weeklyScores: buildWeeklyScores(rows, weather.daily.time),
    dayLabels: dayLabelsFromDates(weather.daily.time),
    hourly: buildHourlyBars(rows, todayKey),
    hourlyScoresFull: rows,
    dailyKeys: weather.daily.time,
    tideTimes: hourly.time,
    tideHeights: hourly.sea_level_height_msl,
    tideUnavailable,
    scoringConfig: spotScoringConfig(spot),
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
              dayLabels: dayLabelsFromDates([]),
              hourly: [],
              scoringConfig: spotScoringConfig(spot),
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
  const dayStr = spot.dailyKeys?.[dayIndex];
  if (!dayStr || !spot.hourlyScoresFull?.length) {
    return { ...spot, score: spot.weeklyScores[dayIndex] ?? spot.score };
  }

  const dayScores = spot.hourlyScoresFull.filter((h) => localDateKey(h.time) === dayStr);
  if (dayScores.length === 0) {
    return { ...spot, score: spot.weeklyScores[dayIndex] ?? spot.score };
  }

  const noon =
    dayScores.find((h) => hourFromIso(h.time) === 12) ??
    dayScores[Math.floor(dayScores.length / 2)];
  const wx = weatherCodeToLabel(noon.weatherCode);
  const at = new Date(noon.time);

  return {
    ...spot,
    score: spot.weeklyScores[dayIndex] ?? noon.scoreTotal,
    hourly: buildHourlyBars(spot.hourlyScoresFull, dayStr),
    waves: {
      height: Math.round(noon.waveHeight * 10) / 10,
      period: Math.round(noon.wavePeriod),
      direction: degreesToCompass(noon.waveDirection),
    },
    wind: {
      speed: Math.round(noon.windSpeedKnots),
      direction: degreesToCompass(noon.windDirection),
      gust: noon.windGustKnots,
    },
    water: { temp: Math.round(noon.waterTemp ?? spot.water.temp) },
    weather: { temp: noon.airTemp, condition: wx.condition, emoji: wx.emoji },
    tide:
      spot.tideUnavailable || !spot.tideTimes || !spot.tideHeights
        ? spot.tide
        : formatTideLabel(spot.tideTimes, spot.tideHeights, at),
  };
}

/** Score row used for display (current hour today, noon on other days). */
export function getScoreRowForDay(spot: SpotView, dayIndex: number): HourlyScoreRow | null {
  if (!spot.hourlyScoresFull?.length) return null;

  const dayStr = spot.dailyKeys?.[dayIndex];
  if (!dayStr) return spot.hourlyScoresFull[0] ?? null;

  const dayScores = spot.hourlyScoresFull.filter((h) => localDateKey(h.time) === dayStr);
  if (dayScores.length === 0) return null;

  if (dayIndex === 0) {
    const now = new Date();
    const current = spot.hourlyScoresFull.find((h) => new Date(h.time) >= now);
    if (current && localDateKey(current.time) === dayStr) return current;
  }

  return (
    dayScores.find((h) => hourFromIso(h.time) === 12) ??
    dayScores[Math.floor(dayScores.length / 2)]
  );
}
