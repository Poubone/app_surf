export interface OpenMeteoHourly {
  time: string[];
  wave_height: number[];
  wave_period: number[];
  wave_direction: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  sea_level_height_msl: (number | null)[];
}

export interface MarineForecast {
  hourly: OpenMeteoHourly;
}

const MS_TO_KNOTS = 1.944;

export async function fetchMarineForecast(
  latitude: number,
  longitude: number,
): Promise<MarineForecast> {
  const url = new URL('https://marine-api.open-meteo.com/v1/marine');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set(
    'hourly',
    'wave_height,wave_period,wave_direction,wind_speed_10m,wind_direction_10m,sea_level_height_msl',
  );
  url.searchParams.set('timezone', 'Europe/Paris');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('cell_selection', 'sea');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  return res.json();
}

export function toHourlyConditions(hourly: OpenMeteoHourly, index: number) {
  return {
    waveHeight: hourly.wave_height[index] ?? 0,
    wavePeriod: hourly.wave_period[index] ?? 0,
    waveDirection: hourly.wave_direction[index] ?? 0,
    windSpeedKnots: (hourly.wind_speed_10m[index] ?? 0) * MS_TO_KNOTS,
    windDirection: hourly.wind_direction_10m[index] ?? 0,
  };
}
