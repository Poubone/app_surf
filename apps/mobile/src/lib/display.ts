const KMH_TO_KNOTS = 1 / 1.852;

export function getScoreColor(score: number): string {
  if (score >= 80) return '#00e5a0';
  if (score >= 60) return '#00c4ff';
  if (score >= 30) return '#ffb84d';
  return '#ff5252';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 30) return 'Moyen';
  return 'Mauvais';
}

export function kmhToKnots(kmh: number): number {
  return Math.round(kmh * KMH_TO_KNOTS);
}

const COMPASS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];

export function degreesToCompass(deg: number): string {
  const n = ((deg % 360) + 360) % 360;
  const idx = Math.round(n / 22.5) % 16;
  return COMPASS_16[idx];
}

export function weatherCodeToLabel(code: number): { condition: string; emoji: string } {
  if (code === 0) return { condition: 'Ensoleillé', emoji: '☀️' };
  if (code <= 3) return { condition: 'Nuageux', emoji: '⛅' };
  if (code <= 48) return { condition: 'Brouillard', emoji: '🌫️' };
  if (code <= 57) return { condition: 'Bruine', emoji: '🌦️' };
  if (code <= 67) return { condition: 'Pluvieux', emoji: '🌧️' };
  if (code <= 77) return { condition: 'Neige', emoji: '🌨️' };
  if (code <= 82) return { condition: 'Averses', emoji: '🌧️' };
  if (code <= 86) return { condition: 'Neige', emoji: '🌨️' };
  if (code <= 99) return { condition: 'Orage', emoji: '⛈️' };
  return { condition: 'Variable', emoji: '☁️' };
}

export function localDateKey(isoTime: string): string {
  return isoTime.slice(0, 10);
}
