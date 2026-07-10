import { ArrowLeft, TrendingUp } from 'lucide-react';
import { getScoreColor } from '../lib/display';
import { DAYS, type SpotView } from '../types';

export function WeeklyView({
  spots,
  onBack,
  onSpotClick,
}: {
  spots: SpotView[];
  onBack: () => void;
  onSpotClick: (spot: SpotView, day: number) => void;
}) {
  const best = spots.reduce<{ spot: SpotView; score: number; day: number } | null>((acc, spot) => {
    spot.weeklyScores.forEach((s, i) => {
      if (!acc || s > acc.score) acc = { spot, score: s, day: i };
    });
    return acc;
  }, null);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
              7 jours · Tous les spots
            </p>
          </div>
          <TrendingUp size={20} style={{ color: '#00d4a8' }} />
        </div>

        <div className="flex gap-2 mt-5">
          <div className="w-28 shrink-0" />
          {DAYS.map((d, i) => (
            <div
              key={d}
              className="flex-1 text-center py-1 rounded-lg"
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
      </div>

      <div className="flex flex-col">
        {spots.map((spot) => (
          <div key={spot.id} className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button type="button" onClick={() => onSpotClick(spot, 0)} className="w-28 shrink-0 text-left" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <div className="text-sm font-semibold text-foreground truncate">{spot.name}</div>
              <div className="text-xs text-muted-foreground">{spot.region}</div>
            </button>
            {spot.weeklyScores.map((s, i) => {
              const c = getScoreColor(s);
              return (
                <button key={DAYS[i]} type="button" onClick={() => onSpotClick(spot, i)} className="flex-1 flex justify-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border"
                    style={{
                      backgroundColor: i === 0 ? `${c}22` : 'rgba(255,255,255,0.03)',
                      borderColor: i === 0 ? c : 'rgba(255,255,255,0.08)',
                      color: c,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.7rem',
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

      {best && (
        <div className="px-6 py-5">
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
              {DAYS[best.day]} · {best.spot.name} · Score {best.score}/10
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
