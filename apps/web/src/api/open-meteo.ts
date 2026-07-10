export interface OpenMeteoHourly {
  time: string[];
  wave_height: number[];
  wave_period: number[];
  wave_direction: number[];
  wind_speed_10m: (number | null)[];
  wind_direction_10m: (number | null)[];
  sea_level_height_msl: (number | null)[];
  sea_surface_temperature: (number | null)[];
}

export interface MarineForecast {
  hourly: OpenMeteoHourly;
}

export async function fetchMarineForecast(
  latitude: number,
  longitude: number,
  forecastDays = 7,
): Promise<MarineForecast> {
  const url = new URL('https://marine-api.open-meteo.com/v1/marine');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set(
    'hourly',
    'wave_height,wave_period,wave_direction,wind_speed_10m,wind_direction_10m,sea_level_height_msl,sea_surface_temperature',
  );
  url.searchParams.set('timezone', 'Europe/Paris');
  url.searchParams.set('forecast_days', String(forecastDays));
  url.searchParams.set('cell_selection', 'sea');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo Marine error: ${res.status}`);
  return res.json();
}

/** Wave data from marine API; wind is often null at sea cells — use weather API instead. */
export function toMarineWaveConditions(hourly: OpenMeteoHourly, index: number) {
  return {
    waveHeight: hourly.wave_height[index] ?? 0,
    wavePeriod: hourly.wave_period[index] ?? 0,
    waveDirection: hourly.wave_direction[index] ?? 0,
  };
}
