import type { ScoreBreakdown, TideStage } from '@app-surf/scoring';
import { degreesToCompass } from '../lib/display';
import type { HourlyScoreRow, SpotScoringConfig } from '../types';

const TIDE_LABELS: Record<TideStage, string> = {
  low: 'Basse mer',
  'mid-rising': 'Mi-marée montante',
  'mid-falling': 'Mi-marée descendante',
  high: 'Pleine mer',
};

const WIND_LABELS_FR: Record<ScoreBreakdown['windLabel'], string> = {
  Glassy: 'Glassy (calme)',
  Offshore: 'Offshore',
  'Cross-shore': 'Croisé',
  Onshore: 'Onshore',
};

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex justify-between gap-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
        {label}
      </span>
      <div className="text-right">
        <div className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {value}
        </div>
        {sub && (
          <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreLine({ label, score, max, detail }: { label: string; score: number; max: number; detail: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {label}
        </span>
        <span className="text-sm font-bold" style={{ fontFamily: "'Space Mono', monospace" }}>
          {score}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground m-0" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}>
        {detail}
      </p>
    </div>
  );
}

export function ScoreBreakdownPanel({
  row,
  config,
  tideUnavailable,
}: {
  row: HourlyScoreRow;
  config: SpotScoringConfig;
  tideUnavailable?: boolean;
}) {
  const b = row.scoreBreakdown;
  const raw = b.swellScore + b.windScore + (tideUnavailable ? 0 : b.tideScore);

  return (
    <div
      className="p-4 rounded-2xl flex flex-col gap-1"
      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-xs text-muted-foreground m-0 mb-3" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}>
        Formule : (Houle + Vent + Marée) × malus vent ={' '}
        <strong className="text-foreground">
          ({b.swellScore} + {b.windScore} + {tideUnavailable ? 0 : b.tideScore}) × {b.windMalus.toFixed(2)} = {row.scoreTotal}
        </strong>
        /100
      </p>

      <ScoreLine
        label="Houle"
        score={b.swellScore}
        max={50}
        detail={`${row.waveHeight} m · ${row.wavePeriod}s · ${degreesToCompass(row.waveDirection)} — fenêtre idéale ${config.idealSwellHeightMin}–${config.idealSwellHeightMax} m, direction ${config.swellAngleMin}°–${config.swellAngleMax}°`}
      />
      <ScoreLine
        label="Vent"
        score={b.windScore}
        max={30}
        detail={`${Math.round(row.windSpeedKnots)} kn ${degreesToCompass(row.windDirection)} (${WIND_LABELS_FR[b.windLabel]}) — offshore idéal ${config.windOffshoreMin}°–${config.windOffshoreMax}°`}
      />
      <ScoreLine
        label="Marée"
        score={tideUnavailable ? 0 : b.tideScore}
        max={20}
        detail={
          tideUnavailable
            ? 'Niveau mer indisponible (Open-Meteo)'
            : `${TIDE_LABELS[row.tideStage]} — optimal spot : ${TIDE_LABELS[config.tideOptimalStage]}`
        }
      />

      <Row
        label="Malus vent"
        value={`× ${b.windMalus.toFixed(2)}`}
        sub={`Appliqué sur (${raw}) → ${row.scoreTotal}/100`}
      />

      <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem' }}>
          Références spot (scrapées)
        </p>
        <Row label="Orientation plage" value={`${config.beachOrientation}°`} />
        <Row label="Fond / niveau" value={`${config.bottomType ?? '—'} · ${config.level ?? '—'}`} />
      </div>
    </div>
  );
}
