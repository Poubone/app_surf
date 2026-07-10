import { HourlyScoreChart } from './HourlyScoreChart';
import type { SpotConditions } from '../hooks/useSurfConditions';

export function SpotDetailPanel({
  data,
  onClose,
}: {
  data: SpotConditions;
  onClose: () => void;
}) {
  const { spot, currentScore, hourlyScores, error, tideUnavailable } = data;

  return (
    <aside className="detail-panel">
      <button type="button" className="close" onClick={onClose} aria-label="Fermer">
        ✕
      </button>
      <h2>{spot.name}</h2>
      {error ? (
        <p className="error">Données indisponibles : {error}</p>
      ) : (
        <>
          <p className="score">{currentScore.total}/100</p>
          <p className="badge">{currentScore.windLabel}</p>
          {tideUnavailable && <p className="warn">Marée indisponible</p>}
          <HourlyScoreChart data={hourlyScores} />
          {spot.descriptionFr && <p className="desc">{spot.descriptionFr}</p>}
          <p className="meta">
            Fond : {spot.bottomType ?? '—'} · Niveau : {spot.level ?? '—'}
          </p>
        </>
      )}
      <style>{`
        .detail-panel {
          width: 380px;
          min-width: 380px;
          background: #fff;
          border-left: 1px solid #e5e7eb;
          padding: 24px;
          overflow-y: auto;
          position: relative;
        }
        .close {
          position: absolute;
          top: 16px;
          right: 16px;
          border: none;
          background: #f3f4f6;
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }
        h2 { margin: 0 32px 8px 0; font-size: 1.5rem; }
        .score { font-size: 3rem; font-weight: 800; margin: 8px 0; line-height: 1; }
        .badge { color: #2563eb; font-weight: 600; margin: 0 0 16px; }
        .warn { color: #f97316; margin: 0 0 12px; }
        .desc { margin-top: 16px; line-height: 1.5; color: #444; }
        .meta { margin-top: 12px; color: #888; font-size: 0.85rem; }
        .error { color: #ef4444; }
      `}</style>
    </aside>
  );
}
