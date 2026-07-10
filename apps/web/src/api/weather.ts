export interface WeatherForecast {
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    wind_gusts_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
  };
}

export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
  forecastDays = 7,
): Promise<WeatherForecast> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('hourly', 'temperature_2m,weather_code,wind_gusts_10m');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max');
  url.searchParams.set('timezone', 'Europe/Paris');
  url.searchParams.set('forecast_days', String(forecastDays));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo Forecast error: ${res.status}`);
  return res.json();
}
