import * as cheerio from 'cheerio';
import type { TideStage } from '@app-surf/scoring';

export interface SurfReportData {
  descriptionFr: string;
  tideOptimalStage?: TideStage;
}

export function parseSurfReport(html: string): SurfReportData {
  const $ = cheerio.load(html);
  const paragraphs = $('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 80);
  const descriptionFr = paragraphs[0] ?? '';

  const full = $('body').text().toLowerCase();
  let tideOptimalStage: TideStage | undefined;
  if (full.includes('mi-marée') || full.includes('mi marée')) tideOptimalStage = 'mid-rising';
  else if (full.includes('marée basse')) tideOptimalStage = 'low';
  else if (full.includes('marée haute')) tideOptimalStage = 'high';

  return { descriptionFr, tideOptimalStage };
}
