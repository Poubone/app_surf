import * as cheerio from 'cheerio';

export interface SurfForecastData {
  swellAngleMin: number;
  swellAngleMax: number;
  windOffshoreMin: number;
  windOffshoreMax: number;
}

const COMPASS_TO_DEG: Record<string, number> = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

const WORD_TO_ABBR: Record<string, string> = {
  north: 'N',
  northeast: 'NE',
  east: 'E',
  southeast: 'SE',
  south: 'S',
  southwest: 'SW',
  west: 'W',
  northwest: 'NW',
  'north-northeast': 'NNE',
  'east-northeast': 'ENE',
  'east-southeast': 'ESE',
  'south-southeast': 'SSE',
  'south-southwest': 'SSW',
  'west-southwest': 'WSW',
  'west-northwest': 'WNW',
  'north-northwest': 'NNW',
  'west northwest': 'WNW',
  'north northwest': 'NNW',
};

const COMPOUND_EXPANSION: Record<string, string[]> = {
  NNE: ['N', 'NE'],
  ENE: ['NE', 'E'],
  ESE: ['E', 'SE'],
  SSE: ['SE', 'S'],
  SSW: ['S', 'SW'],
  WSW: ['SW', 'W'],
  WNW: ['W', 'NW'],
  NNW: ['NW', 'N'],
};

const ABBR_PATTERN =
  /\b(NNE|ENE|ESE|SSE|SSW|WSW|WNW|NNW|NE|SE|SW|NW|N|E|S|W)\b/gi;

const WORD_PATTERN =
  /\b(west northwest|north northwest|north-northeast|east-northeast|east-southeast|south-southeast|south-southwest|west-southwest|west-northwest|north-northwest|northeast|northwest|southeast|southwest|north|east|south|west)\b/gi;

function parseCompassRange(text: string): { min: number; max: number } {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const abbrs = new Set<string>();

  for (const match of normalized.matchAll(ABBR_PATTERN)) {
    abbrs.add(match[1].toUpperCase());
  }

  for (const match of normalized.matchAll(WORD_PATTERN)) {
    const key = match[1].toLowerCase();
    const abbr = WORD_TO_ABBR[key];
    if (abbr) abbrs.add(abbr);
  }

  if (abbrs.size === 0) {
    throw new Error(`No compass dirs in: ${text}`);
  }

  for (const abbr of [...abbrs]) {
    const expanded = COMPOUND_EXPANSION[abbr];
    if (expanded) {
      abbrs.delete(abbr);
      expanded.forEach((a) => abbrs.add(a));
    }
  }

  const deg = [...abbrs].map((p) => COMPASS_TO_DEG[p]);
  return { min: Math.min(...deg), max: Math.max(...deg) };
}

function extractSwellAndWind(body: string): { swellText: string; windText: string } {
  const swellLabel = body.match(/Best swell direction[:\s]+([^.\n]+)/i);
  const windLabel = body.match(/Best wind[:\s]+([^.\n]+)/i);
  if (swellLabel && windLabel) {
    return { swellText: swellLabel[1], windText: windLabel[1] };
  }

  const idealSwell = body.match(/ideal swell direction is from the ([^.\n]+)/i);
  const offshoreWind = body.match(/Offshore winds are from the ([^.\n]+)/i);
  if (idealSwell && offshoreWind) {
    return { swellText: idealSwell[1], windText: offshoreWind[1] };
  }

  const combo = body.match(
    /when a ([^,\n]+?) swell combines with an offshore wind direction from the ([^.\n]+)/i,
  );
  if (combo) {
    return { swellText: combo[1], windText: combo[2] };
  }

  throw new Error('Could not find Best swell/wind sections');
}

export function parseSurfForecast(html: string): SurfForecastData {
  const $ = cheerio.load(html);
  const body = $('body').text().replace(/\s+/g, ' ');

  const { swellText, windText } = extractSwellAndWind(body);
  const swell = parseCompassRange(swellText);
  const wind = parseCompassRange(windText);

  return {
    swellAngleMin: swell.min,
    swellAngleMax: swell.max,
    windOffshoreMin: wind.min,
    windOffshoreMax: wind.max,
  };
}
