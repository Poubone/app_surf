import { ArrowLeft, TrendingUp } from 'lucide-react';
import { getScoreColor } from '../lib/display';
import type { SpotView } from '../types';

export function WeeklyView({
  spots,
  onBack,
  onSpotClick,
}: {
  spots: SpotView[];
  onBack: () => void;
  onSpotClick: (spot: SpotView, day: number) => void;
}) {
  const dayLabels = spots[0]?.dayLabels ?? [];

  const best = spots.reduce<{ spot: SpotView; score: number; day: number } | null>((acc, spot) => {
    spot.weeklyScores.forEach((s, i) => {
      if (!acc || s > acc.score) acc = { spot, score: s, day: i };
    });
    return acc;
  }, null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm mb-6" style={{ color: 'rgba(232,237,245,0.6)', fontFamily: "'Outfit', sans-serif" }}>
          <ArrowLeft size={16} />
          Retour carte
        </button>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '-0.03em' }}>
              Prévisions
            </h2>
            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>
              7 jours · {spots.length} spots
            </p>
          </div>
          <TrendingUp size={20} style={{ color: '#00d4a8' }} />
        </div>

        <div className="flex gap-2 mt-5 min-w-[36rem]">
          <div className="w-28 shrink-0" />
          {dayLabels.map((d, i) => (
            <div
              key={d + i}
              className="flex-1 min-w-8 text-center py-1 rounded-lg"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.65rem',
                fontWeight: 700,
                color: i === 0 ? '#00d4a8' : 'rgba(232,237,245,0.4)',
                backgroundColor: i === 0 ? 'rgba(0,212,168,0.08)' : 'transparent',
              }}
            >
              {d}
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="min-w-[36rem]">
          {spots.map((spot) => (
            <div
              key={spot.id}
              className="flex items-center gap-2 px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <button type="button" onClick={() => onSpotClick(spot, 0)} className="w-28 shrink-0 text-left" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <div className="text-sm font-semibold text-foreground truncate">{spot.name}</div>
                <div className="text-xs text-muted-foreground">{spot.region}</div>
              </button>
              {spot.weeklyScores.map((s, i) => {
                const c = getScoreColor(s);
                return (
                  <button key={i} type="button" onClick={() => onSpotClick(spot, i)} className="flex-1 min-w-8 flex justify-center">
                    <div
                      className="min-w-8 h-8 px-1 rounded-full flex items-center justify-center text-xs font-bold border"
                      style={{
                        backgroundColor: i === 0 ? `${c}22` : 'rgba(255,255,255,0.03)',
                        borderColor: i === 0 ? c : 'rgba(255,255,255,0.08)',
                        color: c,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '0.6rem',
                        opacity: i === 0 ? 1 : 0.7,
                      }}
                    >
                      {s}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {best && (
        <footer className="shrink-0 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,168,0.12) 0%, rgba(0,170,255,0.08) 100%)',
              border: '1px solid rgba(0,212,168,0.2)',
            }}
          >
            <div className="text-sm font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Meilleure session de la semaine
            </div>
            <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Space Mono', monospace" }}>
              {best.spot.dayLabels[best.day]} · {best.spot.name} · Score {best.score}/100
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
