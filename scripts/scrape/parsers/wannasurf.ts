import * as cheerio from 'cheerio';
import type { TideStage } from '@app-surf/scoring';

export interface WannasurfData {
  bottomType: string;
  level: string;
  tideOptimalStage: TideStage;
}

function normalizeTide(text: string): TideStage {
  const t = text.toLowerCase();
  if (t.includes('low') || t.includes('basse')) return 'low';
  if (t.includes('high') || t.includes('haute')) return 'high';
  if (t.includes('rising') || t.includes('montante')) return 'mid-rising';
  if (t.includes('falling') || t.includes('descendante')) return 'mid-falling';
  return 'mid-rising';
}

export function parseWannasurf(html: string): WannasurfData {
  const $ = cheerio.load(html);
  const text = $('body').text();

  const bottomMatch = text.match(/Bottom[:\s]+([^\n]+)/i);
  const levelMatch = text.match(/Level[:\s]+([^\n]+)/i);
  const tideMatch = text.match(/Tide position[:\s]+([^\n]+)/i);

  return {
    bottomType: bottomMatch?.[1]?.trim().toLowerCase() ?? 'sand',
    level: levelMatch?.[1]?.trim().toLowerCase() ?? 'intermediate',
    tideOptimalStage: normalizeTide(tideMatch?.[1] ?? 'mid'),
  };
}
