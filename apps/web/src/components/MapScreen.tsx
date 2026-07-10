import { Search, Calendar, X, MapPin, ChevronRight } from 'lucide-react';
import { getScoreColor } from '../lib/display';
import type { SpotView } from '../types';
import { SurfMap } from './SurfMap';

export function MapScreen({
  spots,
  searchQuery,
  setSearchQuery,
  onSpotClick,
  selectedSpotId,
  onWeekly,
  loading,
  onRefresh,
}: {
  spots: SpotView[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSpotClick: (spot: SpotView) => void;
  selectedSpotId: string | null;
  onWeekly: () => void;
  loading: boolean;
  onRefresh: () => void;
}) {
  const visible = searchQuery.trim()
    ? spots.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : spots;

  return (
    <div className="flex flex-col h-full relative">
      <div
        className="relative z-20 flex flex-col gap-3 px-6 pt-6 pb-4"
        style={{ background: 'linear-gradient(to bottom, #070c16 70%, transparent)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '-0.02em' }}>
              SurfScore
            </h1>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
              Pays Basque · Auj.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: '#e8edf5',
                fontFamily: "'Outfit', sans-serif",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '…' : 'Actualiser'}
            </button>
            <button
              type="button"
              onClick={onWeekly}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: 'rgba(0,212,168,0.12)',
                border: '1px solid rgba(0,212,168,0.25)',
                color: '#00d4a8',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <Calendar size={15} />
              Semaine
            </button>
          </div>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl max-w-md"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un spot..."
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}>
              <X size={15} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden min-h-0">
        <SurfMap spots={visible} selectedId={selectedSpotId} onSelect={onSpotClick} />

        {searchQuery && (
          <div
            className="absolute bottom-4 left-4 right-4 max-w-lg rounded-2xl overflow-hidden z-20"
            style={{
              backgroundColor: 'rgba(14,23,36,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {visible.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Aucun spot trouvé
              </div>
            ) : (
              visible.map((spot, i) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => {
                    onSpotClick(spot);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontFamily: "'Outfit', sans-serif" }}
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={14} style={{ color: getScoreColor(spot.score) }} />
                    <div className="text-left">
                      <div className="text-sm font-semibold text-foreground">{spot.name}</div>
                      <div className="text-xs text-muted-foreground">{spot.region}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded-lg"
                      style={{
                        color: getScoreColor(spot.score),
                        backgroundColor: `${getScoreColor(spot.score)}15`,
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {spot.score}/100
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {!searchQuery && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-10 pointer-events-none">
            {[
              { label: 'Excellent', score: 85 },
              { label: 'Bon', score: 65 },
              { label: 'Moyen', score: 45 },
              { label: 'Faible', score: 20 },
            ].map(({ label, score }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getScoreColor(score) }} />
                <span className="text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
