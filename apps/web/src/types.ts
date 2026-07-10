import type { TideStage } from '@app-surf/scoring';
import type { ScoreBreakdown } from '@app-surf/scoring';

export interface SpotScoringConfig {
  beachOrientation: number;
  swellAngleMin: number;
  swellAngleMax: number;
  windOffshoreMin: number;
  windOffshoreMax: number;
  idealSwellHeightMin: number;
  idealSwellHeightMax: number;
  tideOptimalStage: TideStage;
  bottomType?: string;
  level?: string;
}

export interface SpotView {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  /** Score sur 100 */
  score: number;
  waves: { height: number; period: number; direction: string };
  wind: { speed: number; direction: string; gust: number };
  water: { temp: number };
  tide: string;
  weather: { temp: number; condition: string; emoji: string };
  weeklyScores: number[];
  dayLabels: string[];
  hourly: { hour: string; score: number; height: number }[];
  hourlyScoresFull?: HourlyScoreRow[];
  scoringConfig: SpotScoringConfig;
  dailyKeys?: string[];
  tideTimes?: string[];
  tideHeights?: (number | null)[];
  tideUnavailable?: boolean;
  error?: string;
}

export interface HourlyScoreRow {
  time: string;
  scoreTotal: number;
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  windSpeedKnots: number;
  windDirection: number;
  windGustKnots: number;
  airTemp: number;
  weatherCode: number;
  waterTemp: number | null;
  tideStage: TideStage;
  scoreBreakdown: Pick<ScoreBreakdown, 'swellScore' | 'windScore' | 'tideScore' | 'windMalus' | 'windLabel'>;
}

export const DISPLAY_HOURS = [6, 8, 10, 12, 14, 16, 18, 20];
