export type TideStage = 'low' | 'mid-rising' | 'mid-falling' | 'high';

export interface Spot {
  spotId: string;
  name: string;
  slug: string;
  /** Code département INSEE (ex. "64") */
  department: string;
  departmentName: string;
  /** Slug Surf-Forecast pour rapprochement catalogue */
  surfForecastSlug?: string;
  latitude: number;
  longitude: number;
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
  descriptionFr?: string;
  /** Page webcam (ex. Surf-Report) */
  webcamUrl?: string;
  webcamProvider?: string;
}

export interface HourlyConditions {
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  windSpeedKnots: number;
  windDirection: number;
  tideStage: TideStage;
}

export interface ScoreBreakdown {
  swellScore: number;
  windScore: number;
  tideScore: number;
  windMalus: number;
  saturationMalus: number;
  total: number;
  windLabel: 'Glassy' | 'Offshore' | 'Cross-shore' | 'Onshore';
}
