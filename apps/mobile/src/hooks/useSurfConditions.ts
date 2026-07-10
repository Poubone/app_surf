import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeSurfScore, isSurfDaylightHour, isSurfDaylightTime, NIGHT_SCORE, pickCurrentDaylightIndex, type Spot, type ScoreBreakdown, type TideStage } from '@app-surf/scoring';
import { fetchMarineForecast, toMarineWaveConditions, type MarineForecast } from '../api/open-meteo';
import { fetchWeatherForecast, type WeatherForecast } from '../api/weather';
import { hasSeaLevelData, tideStageFromSeaLevel } from '../api/tide';
import { loadCatalog, type CatalogSpot } from '../data/catalog';
import { loadSpots } from '../data/loadSpots';
import { buildDepartmentOptions, type DepartmentOption } from '../lib/departments';
import { dayLabelsFromDates, hourFromIso } from '../lib/days';
import { degreesToCompass, kmhToKnots, localDateKey, weatherCodeToLabel } from '../lib/display';
import { formatTideLabel } from '../lib/tide-label';
import { getJsonItem, setJsonItem } from '../lib/storage';
import { loadScoredViewsFromStorage, saveScoredViewsToStorage } from '../lib/scored-views-cache';
import { stripHeavyFields } from '../lib/map-pins';
import { DISPLAY_HOURS, type HourlyScoreRow, type SpotScoringConfig, type SpotView } from '../types';

const DEFAULT_DEPARTMENT = '64';
const SCORED_STORAGE_KEY = 'surfscore-scored-departments';
const REFRESH_CONCURRENCY = 2;
const SPOTS_LOAD_DELAY_MS = 4000;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

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
  return dailyTimes.map((day) => {
    const dayRows = rows.filter(
      (r) => localDateKey(r.time) === day && isSurfDaylightTime(r.time),
    );
    if (dayRows.length === 0) return 0;
    return Math.max(...dayRows.map((r) => r.scoreTotal));
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

function spotMetaFromSpot(spot: Spot) {
  return {
    surfForecastSlug: spot.surfForecastSlug,
    descriptionFr: spot.descriptionFr,
    bottomType: spot.bottomType,
    level: spot.level,
  };
}

function catalogPin(catalog: CatalogSpot, scraped?: Spot): SpotView {
  const meta = scraped
    ? { ...spotMetaFromSpot(scraped), scoringConfig: spotScoringConfig(scraped) }
    : null;
  return {
    id: `catalog:${catalog.surfForecastSlug}`,
    slug: catalog.surfForecastSlug,
    surfForecastSlug: catalog.surfForecastSlug,
    name: catalog.name,
    region: catalog.departmentName,
    department: catalog.department,
    departmentName: catalog.departmentName,
    latitude: catalog.latitude,
    longitude: catalog.longitude,
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
    scoringConfig: meta?.scoringConfig ?? {
      beachOrientation: 0,
      swellAngleMin: 0,
      swellAngleMax: 0,
      windOffshoreMin: 0,
      windOffshoreMax: 0,
      idealSwellHeightMin: 0,
      idealSwellHeightMax: 0,
      tideOptimalStage: 'mid-rising',
    },
    descriptionFr: meta?.descriptionFr,
    bottomType: meta?.bottomType,
    level: meta?.level,
  };
}

function emptyScoredView(spot: Spot, message: string): SpotView {
  return {
    id: spot.spotId,
    slug: spot.slug,
    ...spotMetaFromSpot(spot),
    name: spot.name,
    region: spot.departmentName,
    department: spot.department,
    departmentName: spot.departmentName,
    latitude: spot.latitude,
    longitude: spot.longitude,
    hasScore: true,
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
    error: message,
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
    const score = isSurfDaylightHour(hourFromIso(time))
      ? (() => {
          const s = computeSurfScore(spot, conditions);
          if (tideUnavailable) {
            s.tideScore = 0;
            s.total = Math.round((s.swellScore + s.windScore) * s.windMalus);
          }
          return s;
        })()
      : { ...NIGHT_SCORE };
    return { time, score, conditions };
  });

  const rows = hourly.time.map((_, i) => rowFromIndex(marine, weather, hourlyScores, i));

  const idx = pickCurrentDaylightIndex(hourly.time, now);
  const current = rows[idx];
  const wx = weatherCodeToLabel(current.weatherCode);

  return {
    id: spot.spotId,
    slug: spot.slug,
    ...spotMetaFromSpot(spot),
    name: spot.name,
    region: spot.departmentName,
    department: spot.department,
    departmentName: spot.departmentName,
    latitude: spot.latitude,
    longitude: spot.longitude,
    hasScore: true,
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

function mergeCatalogWithScores(
  catalog: CatalogSpot[],
  scoredBySlug: Map<string, SpotView>,
  scoredBySfSlug: Map<string, SpotView>,
  scrapedBySfSlug: Map<string, Spot>,
): SpotView[] {
  return catalog.map((entry) => {
    const scraped = scrapedBySfSlug.get(entry.surfForecastSlug);
    const scored =
      scoredBySfSlug.get(entry.surfForecastSlug) ??
      [...scoredBySlug.values()].find(
        (s) =>
          s.slug === entry.surfForecastSlug ||
          Math.abs(s.latitude - entry.latitude) < 0.02 &&
            Math.abs(s.longitude - entry.longitude) < 0.02,
      );
    if (scored) {
      return stripHeavyFields({
        ...scored,
        latitude: entry.latitude,
        longitude: entry.longitude,
        descriptionFr: scored.descriptionFr ?? scraped?.descriptionFr,
        bottomType: scored.bottomType ?? scraped?.bottomType,
        level: scored.level ?? scraped?.level,
        surfForecastSlug: entry.surfForecastSlug,
      });
    }
    return catalogPin(entry, scraped);
  });
}

export function useSurfConditions() {
  const [catalog, setCatalog] = useState<CatalogSpot[]>([]);
  const [scrapedSpots, setScrapedSpots] = useState<Spot[]>([]);
  const [scoredViews, setScoredViews] = useState<Map<string, SpotView>>(new Map());
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [refreshingDept, setRefreshingDept] = useState<string | null>(null);
  const [refreshingSpotSlug, setRefreshingSpotSlug] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [weeklyDepartment, setWeeklyDepartment] = useState(DEFAULT_DEPARTMENT);

  const scrapedByDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of scrapedSpots) {
      m.set(s.department, (m.get(s.department) ?? 0) + 1);
    }
    return m;
  }, [scrapedSpots]);

  const departments = useMemo(
    () => buildDepartmentOptions(catalog, scrapedByDept),
    [catalog, scrapedByDept],
  );

  const scoredBySlug = useMemo(() => {
    const m = new Map<string, SpotView>();
    for (const v of scoredViews.values()) {
      if (v.slug) m.set(v.slug, v);
    }
    return m;
  }, [scoredViews]);

  const scoredBySfSlug = useMemo(() => {
    const sfByOurSlug = new Map(scrapedSpots.map((s) => [s.slug, s.surfForecastSlug]));
    const m = new Map<string, SpotView>();
    for (const [id, view] of scoredViews) {
      const spot = scrapedSpots.find((s) => s.spotId === id);
      const sf = spot?.surfForecastSlug ?? (view.slug ? sfByOurSlug.get(view.slug) : undefined);
      if (sf) m.set(sf, view);
    }
    return m;
  }, [scoredViews, scrapedSpots]);

  const scrapedBySfSlug = useMemo(() => {
    const m = new Map<string, Spot>();
    for (const s of scrapedSpots) {
      if (s.surfForecastSlug) m.set(s.surfForecastSlug, s);
    }
    return m;
  }, [scrapedSpots]);

  const mapSpots = useMemo(
    () => mergeCatalogWithScores(catalog, scoredBySlug, scoredBySfSlug, scrapedBySfSlug),
    [catalog, scoredBySlug, scoredBySfSlug, scrapedBySfSlug],
  );

  const weeklySpots = useMemo(
    () =>
      mapSpots.filter(
        (s) => s.hasScore && s.department === weeklyDepartment && !s.error,
      ),
    [mapSpots, weeklyDepartment],
  );

  const resolveSpotDetail = useCallback(
    (spot: SpotView): SpotView => {
      const full =
        scoredViews.get(spot.id) ??
        [...scoredViews.values()].find(
          (s) =>
            (spot.surfForecastSlug && s.surfForecastSlug === spot.surfForecastSlug) ||
            (spot.slug && s.slug === spot.slug),
        );
      return full ?? spot;
    },
    [scoredViews],
  );

  const refreshSpot = useCallback(
    async (surfForecastSlug: string): Promise<SpotView | null> => {
      let spots = scrapedSpots;
      if (spots.length === 0) {
        spots = await loadSpots();
        setScrapedSpots(spots);
      }
      const spot = spots.find((s) => s.surfForecastSlug === surfForecastSlug);
      if (!spot) return null;

      setRefreshingSpotSlug(surfForecastSlug);
      setNetworkError(false);
      try {
        const view = await buildSpotView(spot);
        setScoredViews((prev) => {
          const next = new Map(prev);
          next.set(view.id, view);
          void saveScoredViewsToStorage(next);
          return next;
        });
        return view;
      } catch (e) {
        const errView = emptyScoredView(spot, String(e));
        setScoredViews((prev) => {
          const next = new Map(prev);
          next.set(errView.id, errView);
          void saveScoredViewsToStorage(next);
          return next;
        });
        return errView;
      } finally {
        setRefreshingSpotSlug(null);
      }
    },
    [scrapedSpots],
  );

  const refreshDepartment = useCallback(
    async (departmentCode: string) => {
      let spots = scrapedSpots;
      if (spots.length === 0) {
        spots = await loadSpots();
        setScrapedSpots(spots);
      }

      const deptSpots = spots.filter((s) => s.department === departmentCode);
      if (deptSpots.length === 0) return;

      setRefreshingDept(departmentCode);
      setNetworkError(false);
      try {
        const results = await mapWithConcurrency(deptSpots, REFRESH_CONCURRENCY, async (spot) => {
          try {
            return await buildSpotView(spot);
          } catch (e) {
            return emptyScoredView(spot, String(e));
          }
        });
        setScoredViews((prev) => {
          const next = new Map(prev);
          for (const view of results) next.set(view.id, view);
          void saveScoredViewsToStorage(next);
          return next;
        });
        const stored = await getJsonItem<string[]>(SCORED_STORAGE_KEY, []);
        await setJsonItem(SCORED_STORAGE_KEY, [...new Set([...stored, departmentCode])]);
      } catch {
        setNetworkError(true);
      } finally {
        setRefreshingDept(null);
      }
    },
    [scrapedSpots],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      setNetworkError(false);
      try {
        const cat = await loadCatalog();
        if (cancelled) return;
        setCatalog(cat);
      } catch {
        if (!cancelled) setNetworkError(true);
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();

    const spotsTimer = setTimeout(() => {
      void (async () => {
        try {
          const scraped = await loadSpots();
          if (cancelled) return;
          setScrapedSpots(scraped);
          const cached = await loadScoredViewsFromStorage();
          if (!cancelled && cached.size > 0) setScoredViews(cached);
        } catch {
          /* spots.json optionnel au démarrage — Actualiser le chargera */
        }
      })();
    }, SPOTS_LOAD_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(spotsTimer);
    };
  }, []);

  const loading = loadingCatalog || refreshingDept !== null || refreshingSpotSlug !== null;

  return {
    mapSpots,
    weeklySpots,
    departments,
    loading,
    loadingCatalog,
    refreshingDept,
    refreshingSpotSlug,
    networkError,
    weeklyDepartment,
    setWeeklyDepartment,
    refreshDepartment,
    refreshSpot,
    resolveSpotDetail,
  };
}

export function spotForDay(spot: SpotView, dayIndex: number): SpotView {
  return spotForHour(spot, dayIndex, null);
}

function dayScoresFor(spot: SpotView, dayIndex: number): HourlyScoreRow[] {
  const dayStr = spot.dailyKeys?.[dayIndex];
  if (!dayStr || !spot.hourlyScoresFull?.length) return [];
  return spot.hourlyScoresFull.filter(
    (h) => localDateKey(h.time) === dayStr && isSurfDaylightTime(h.time),
  );
}

export function getScoreRowForHour(
  spot: SpotView,
  dayIndex: number,
  hour?: number | null,
): HourlyScoreRow | null {
  const dayScores = dayScoresFor(spot, dayIndex);
  if (dayScores.length === 0) return null;

  if (hour != null) {
    const exact = dayScores.find((h) => hourFromIso(h.time) === hour);
    if (exact) return exact;
    return dayScores.reduce((best, h) =>
      Math.abs(hourFromIso(h.time) - hour) < Math.abs(hourFromIso(best.time) - hour) ? h : best,
    );
  }

  if (dayIndex === 0) {
    const dayStr = spot.dailyKeys?.[dayIndex];
    const now = new Date();
    const current = spot.hourlyScoresFull!.find(
      (h) => new Date(h.time) >= now && isSurfDaylightTime(h.time),
    );
    if (current && dayStr && localDateKey(current.time) === dayStr) return current;
  }

  return dayScores.find((h) => hourFromIso(h.time) === DISPLAY_HOURS[0]) ?? dayScores[0];
}

function viewFromRow(spot: SpotView, dayIndex: number, row: HourlyScoreRow): SpotView {
  const dayStr = spot.dailyKeys?.[dayIndex] ?? localDateKey(row.time);
  const wx = weatherCodeToLabel(row.weatherCode);
  const at = new Date(row.time);
  return {
    ...spot,
    score: row.scoreTotal,
    hourly: buildHourlyBars(spot.hourlyScoresFull!, dayStr),
    waves: {
      height: Math.round(row.waveHeight * 10) / 10,
      period: Math.round(row.wavePeriod),
      direction: degreesToCompass(row.waveDirection),
    },
    wind: {
      speed: Math.round(row.windSpeedKnots),
      direction: degreesToCompass(row.windDirection),
      gust: row.windGustKnots,
    },
    water: { temp: Math.round(row.waterTemp ?? spot.water.temp) },
    weather: { temp: row.airTemp, condition: wx.condition, emoji: wx.emoji },
    tide:
      spot.tideUnavailable || !spot.tideTimes || !spot.tideHeights
        ? spot.tide
        : formatTideLabel(spot.tideTimes, spot.tideHeights, at),
  };
}

export function spotForHour(spot: SpotView, dayIndex: number, hour?: number | null): SpotView {
  const dayStr = spot.dailyKeys?.[dayIndex];
  if (!dayStr || !spot.hourlyScoresFull?.length) {
    return { ...spot, score: spot.weeklyScores[dayIndex] ?? spot.score };
  }
  const row = getScoreRowForHour(spot, dayIndex, hour);
  if (!row) {
    return { ...spot, score: spot.weeklyScores[dayIndex] ?? spot.score };
  }
  return viewFromRow(spot, dayIndex, row);
}

/** Score row used for display (current hour today, noon on other days). */
export function getScoreRowForDay(spot: SpotView, dayIndex: number): HourlyScoreRow | null {
  return getScoreRowForHour(spot, dayIndex, null);
}

/** Meilleur créneau horaire (score max) pour un jour donné. */
export function getBestHourForDay(
  spot: SpotView,
  dayIndex: number,
): { hour: string; score: number } | null {
  const dayStr = spot.dailyKeys?.[dayIndex];
  if (!dayStr || !spot.hourlyScoresFull?.length) return null;

  const dayScores = spot.hourlyScoresFull.filter(
    (h) => localDateKey(h.time) === dayStr && isSurfDaylightTime(h.time),
  );
  if (dayScores.length === 0) return null;

  const best = dayScores.reduce((a, b) => (b.scoreTotal > a.scoreTotal ? b : a));
  return {
    hour: `${hourFromIso(best.time).toString().padStart(2, '0')}h`,
    score: best.scoreTotal,
  };
}

/** Meilleur spot du département pour chaque jour de la semaine. */
export function bestSpotPerDay(
  spots: SpotView[],
): Array<{ spot: SpotView; score: number; dayIndex: number } | null> {
  const dayCount = spots[0]?.weeklyScores.length ?? 0;
  return Array.from({ length: dayCount }, (_, dayIndex) => {
    let best: { spot: SpotView; score: number } | null = null;
    for (const spot of spots) {
      const score = spot.weeklyScores[dayIndex] ?? 0;
      if (!best || score > best.score) best = { spot, score };
    }
    return best ? { ...best, dayIndex } : null;
  });
}
