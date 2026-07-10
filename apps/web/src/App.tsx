import { useState } from 'react';
import { useSurfConditions } from './hooks/useSurfConditions';
import { DetailView } from './components/DetailView';
import { MapScreen } from './components/MapScreen';
import { NetworkError } from './components/NetworkError';
import { WeeklyView } from './components/WeeklyView';
import type { SpotView } from './types';

export function App() {
  const { spots, loading, networkError, refresh } = useSurfConditions();
  const [view, setView] = useState<'map' | 'detail' | 'weekly'>('map');
  const [selectedSpot, setSelectedSpot] = useState<SpotView | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  if (networkError) return <NetworkError onRetry={refresh} />;

  function handleSpotClick(spot: SpotView, day = 0) {
    setSelectedSpot(spot);
    setSelectedDay(day);
    setView('detail');
    setSearchQuery('');
  }

  return (
    <div className="h-full w-full flex justify-center bg-background" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="relative w-full max-w-6xl h-full overflow-hidden" style={{ backgroundColor: '#070c16' }}>
        {loading && spots.length === 0 && (
          <div className="absolute inset-0 z-50 flex items-center justify-center text-muted-foreground bg-background/80">
            Chargement des conditions…
          </div>
        )}

        <div
          className="absolute inset-0 transition-transform duration-300 ease-in-out"
          style={{ transform: view === 'map' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <MapScreen
            spots={spots}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSpotClick={(s) => handleSpotClick(s)}
            selectedSpotId={selectedSpot?.id ?? null}
            onWeekly={() => setView('weekly')}
            loading={loading}
            onRefresh={refresh}
          />
        </div>

        <div
          className="absolute inset-0 transition-transform duration-300 ease-in-out"
          style={{ transform: view === 'detail' ? 'translateX(0)' : 'translateX(100%)' }}
        >
          {selectedSpot && (
            <DetailView spot={selectedSpot} onBack={() => setView('map')} initialDay={selectedDay} />
          )}
        </div>

        <div
          className="absolute inset-0 transition-transform duration-300 ease-in-out"
          style={{ transform: view === 'weekly' ? 'translateX(0)' : 'translateX(100%)' }}
        >
          <WeeklyView spots={spots} onBack={() => setView('map')} onSpotClick={handleSpotClick} />
        </div>
      </div>
    </div>
  );
}
