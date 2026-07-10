import * as cheerio from 'cheerio';
import type { TideStage } from '@app-surf/scoring';

const SURF_REPORT_ORIGIN = 'https://www.surf-report.com';

export interface SurfReportData {
  descriptionFr: string;
  tideOptimalStage?: TideStage;
  webcamUrl?: string;
  webcamProvider?: string;
}

/** Lien webcam spot-specific dans le sous-menu (pas le menu générique /webcams/). */
function parseWebcamLink($: cheerio.CheerioAPI): Pick<SurfReportData, 'webcamUrl' | 'webcamProvider'> {
  const href =
    $('.menu-spot-container a[href^="/webcams/"]')
      .map((_, el) => $(el).attr('href') ?? '')
      .get()
      .find((h) => /^\/webcams\/[^/]+\.html$/.test(h)) ?? null;

  if (!href) return {};
  return {
    webcamUrl: `${SURF_REPORT_ORIGIN}${href}`,
    webcamProvider: 'surf-report',
  };
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

  return { descriptionFr, tideOptimalStage, ...parseWebcamLink($) };
}
