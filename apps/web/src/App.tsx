import { useState } from 'react';
import { useSurfConditions } from './hooks/useSurfConditions';
import { SurfMap } from './components/SurfMap';
import { SpotDetailPanel } from './components/SpotDetailPanel';
import { NetworkError } from './components/NetworkError';

export function App() {
  const { spots, loading, networkError, refresh } = useSurfConditions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = spots.find((s) => s.spot.spotId === selectedId) ?? null;

  if (networkError) return <NetworkError onRetry={refresh} />;

  return (
    <div className="app">
      <header className="header">
        <h1>Surf Pays Basque</h1>
        <button type="button" onClick={refresh} disabled={loading}>
          {loading ? 'Chargement…' : 'Actualiser'}
        </button>
      </header>
      <main className="main">
        {loading && spots.length === 0 ? (
          <div className="loader">Chargement des conditions…</div>
        ) : (
          <>
            <SurfMap
              spots={spots}
              selectedId={selectedId}
              onSelect={(s) => setSelectedId(s.spot.spotId)}
            />
            {selected && (
              <SpotDetailPanel data={selected} onClose={() => setSelectedId(null)} />
            )}
          </>
        )}
      </main>
      <footer className="legend">
        ≥60 Bon · 30–59 Moyen · &lt;30 Mauvais · © OpenStreetMap · Open-Meteo
      </footer>
      <style>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }
        .header h1 {
          margin: 0;
          font-size: 1.25rem;
        }
        .header button {
          background: #fff;
          border: 1px solid #d1d5db;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
        }
        .header button:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .main {
          flex: 1;
          display: flex;
          min-height: 0;
          height: calc(100vh - 96px);
        }
        .loader {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
        }
        .legend {
          padding: 8px 20px;
          font-size: 0.8rem;
          color: #666;
          background: #fff;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}
