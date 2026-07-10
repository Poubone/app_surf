import { AlertTriangle } from 'lucide-react';
import {
  bottomTypeLabel,
  isGenericDescription,
  levelLabel,
  spotAccessWarnings,
} from '../lib/spot-info';
import type { SpotView } from '../types';

export function SpotInfoPanel({ spot }: { spot: SpotView }) {
  const warnings = spotAccessWarnings(spot.descriptionFr);
  const showDescription = spot.descriptionFr && !isGenericDescription(spot.descriptionFr);

  if (!showDescription && !spot.level && !spot.bottomType && warnings.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3
        className="text-xs uppercase tracking-widest text-muted-foreground m-0"
        style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}
      >
        À propos du spot
      </h3>

      <div
        className="p-4 rounded-2xl flex flex-col gap-3"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {(spot.level || spot.bottomType) && (
          <div className="flex flex-wrap gap-2">
            {spot.level && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: 'rgba(0,170,255,0.12)',
                  color: '#00aaff',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {levelLabel(spot.level)}
              </span>
            )}
            {spot.bottomType && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: 'rgba(167,139,250,0.12)',
                  color: '#a78bfa',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {bottomTypeLabel(spot.bottomType)}
              </span>
            )}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="flex flex-col gap-2">
            {warnings.map((w) => (
              <div
                key={w}
                className="flex items-start gap-2 text-xs px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: 'rgba(255,184,77,0.1)',
                  border: '1px solid rgba(255,184,77,0.25)',
                  color: '#ffb84d',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {showDescription && (
          <p
            className="text-sm text-muted-foreground m-0 leading-relaxed"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {spot.descriptionFr}
          </p>
        )}
      </div>
    </div>
  );
}
