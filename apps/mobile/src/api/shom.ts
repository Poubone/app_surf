import { computeTideStage, type TideEvent } from '@app-surf/scoring';

const SHOM_BASE = 'https://services.data.shom.fr/maree/v2';
const SAINT_JEAN_DE_LUZ_HARBOR = 66;

interface ShomTideEntry {
  datetime?: string;
  date?: string;
  time?: string;
  dt?: string;
  type?: string;
  state?: string;
  tideType?: string;
}

function parseTideType(raw: string | undefined): 'high' | 'low' {
  const normalized = (raw ?? '').toLowerCase();
  if (
    normalized === 'high' ||
    normalized === 'pm' ||
    normalized.includes('pleine') ||
    normalized.includes('haute')
  ) {
    return 'high';
  }
  return 'low';
}

function parseTideDatetime(entry: ShomTideEntry): Date {
  const raw = entry.datetime ?? entry.dt ?? entry.date ?? entry.time;
  if (!raw) throw new Error('SHOM tide entry missing datetime');
  return new Date(raw);
}

function extractTideEntries(data: unknown): ShomTideEntry[] {
  if (Array.isArray(data)) return data as ShomTideEntry[];

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const candidates = [record.heights, record.tides, record.data, record.tide];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as ShomTideEntry[];
    }
  }

  throw new Error('Unexpected SHOM response shape');
}

export async function fetchTideEvents(date: Date): Promise<TideEvent[]> {
  const apiKey = process.env.EXPO_PUBLIC_SHOM_API_KEY;
  if (!apiKey) throw new Error('EXPO_PUBLIC_SHOM_API_KEY not set');

  const dateStr = date.toISOString().slice(0, 10);
  const url = `${SHOM_BASE}/hlt/${SAINT_JEAN_DE_LUZ_HARBOR}/${dateStr}?apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`SHOM error: ${res.status}`);
  const data = await res.json();

  return extractTideEntries(data).map((entry) => ({
    time: parseTideDatetime(entry),
    type: parseTideType(entry.type ?? entry.state ?? entry.tideType),
  }));
}

export function tideStageAt(events: TideEvent[], at: Date) {
  return computeTideStage(at, events);
}
