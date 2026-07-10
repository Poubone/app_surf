export interface SpotView {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  score: number;
  waves: { height: number; period: number; direction: string };
  wind: { speed: number; direction: string; gust: number };
  water: { temp: number };
  tide: string;
  weather: { temp: number; condition: string; emoji: string };
  weeklyScores: number[];
  hourly: { hour: string; score: number; height: number }[];
  hourlyScoresFull?: HourlyScoreRow[];
  dailyKeys?: string[];
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
}

export const DAYS = ['Auj.', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;
export const DISPLAY_HOURS = [6, 8, 10, 12, 14, 16, 18, 20];
