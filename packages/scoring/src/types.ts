export type TideStage = 'low' | 'mid-rising' | 'mid-falling' | 'high';

export interface Spot {
  spotId: string;
  name: string;
  slug: string;
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
