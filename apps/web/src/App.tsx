import { useEffect, useMemo, useState } from 'react';
import { useSurfConditions } from './hooks/useSurfConditions';
import { DetailView } from './components/DetailView';
import { MapScreen } from './components/MapScreen';
import { NetworkError } from './components/NetworkError';
import { WeeklyView } from './components/WeeklyView';
import type { SpotView } from './types';

export function App() {
  const {
    mapSpots,
    weeklySpots,
    departments,
    loading,
    loadingCatalog,
    refreshingDept,
    networkError,
    weeklyDepartment,
    setWeeklyDepartment,
    refreshDepartment,
    refreshSpot,
    refreshingSpotSlug,
  } = useSurfConditions();

  const [view, setView] = useState<'map' | 'detail' | 'weekly'>('map');
  const [previousView, setPreviousView] = useState<'map' | 'weekly'>('map');
  const [selectedSpot, setSelectedSpot] = useState<SpotView | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  function openDetail(spot: SpotView, day: number, from: 'map' | 'weekly') {
    setPreviousView(from);
    setSelectedSpot(spot);
    setSelectedDay(day);
    setView('detail');
  }

  const scoredDepartmentCount = useMemo(() => {
    const depts = new Set(
      mapSpots.filter((s) => s.hasScore && !s.error).map((s) => s.department),
    );
    return depts.size;
  }, [mapSpots]);

  function handleRefreshDepartment(code: string) {
    setWeeklyDepartment(code);
    refreshDepartment(code);
  }

  if (networkError && mapSpots.length === 0) {
    return <NetworkError onRetry={() => refreshDepartment('64')} />;
  }

  useEffect(() => {
    if (!selectedSpot) return;
    const updated = mapSpots.find(
      (s) =>
        s.id === selectedSpot.id ||
        (!!selectedSpot.surfForecastSlug && s.surfForecastSlug === selectedSpot.surfForecastSlug) ||
        (!!selectedSpot.slug && s.slug === selectedSpot.slug),
    );
    if (updated) setSelectedSpot(updated);
  }, [mapSpots, selectedSpot?.id, selectedSpot?.surfForecastSlug, selectedSpot?.slug]);

  async function handleMapSpotClick(spot: SpotView) {
    const slug = spot.surfForecastSlug ?? spot.slug;
    setSearchQuery('');

    if (slug) {
      openDetail(spot, 0, 'map');
      const updated = await refreshSpot(slug);
      if (updated) setSelectedSpot(updated);
      return;
    }

    if (spot.hasScore && !spot.error) {
      openDetail(spot, 0, 'map');
    }
  }

  function handleSpotClick(spot: SpotView, day = 0) {
    if (!spot.hasScore || spot.error) return;
    openDetail(spot, day, 'weekly');
    setSearchQuery('');
  }

  return (
    <div className="h-screen w-full flex justify-center bg-background" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="relative w-full max-w-6xl h-full min-h-0 overflow-hidden" style={{ backgroundColor: '#070c16' }}>
        {loadingCatalog && mapSpots.length === 0 && (
          <div className="absolute inset-0 z-50 flex items-center justify-center text-muted-foreground bg-background/80">
            Chargement de la carte…
          </div>
        )}

        <div
          className="absolute inset-0 transition-transform duration-300 ease-in-out"
          style={{ transform: view === 'map' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <MapScreen
            spots={mapSpots}
            departments={departments}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSpotClick={handleMapSpotClick}
            selectedSpotId={selectedSpot?.id ?? null}
            onWeekly={() => setView('weekly')}
            loading={loading}
            refreshingDept={refreshingDept}
            refreshingSpotSlug={refreshingSpotSlug}
            onRefreshDepartment={handleRefreshDepartment}
            scoredDepartmentCount={scoredDepartmentCount}
          />
        </div>

        <div
          className="absolute inset-0 transition-transform duration-300 ease-in-out"
          style={{ transform: view === 'detail' ? 'translateX(0)' : 'translateX(100%)' }}
        >
          {selectedSpot && (
            <DetailView spot={selectedSpot} onBack={() => setView(previousView)} initialDay={selectedDay} />
          )}
        </div>

        <div
          className="absolute inset-0 transition-transform duration-300 ease-in-out"
          style={{ transform: view === 'weekly' ? 'translateX(0)' : 'translateX(100%)' }}
        >
          <WeeklyView
            spots={weeklySpots}
            departments={departments}
            department={weeklyDepartment}
            onDepartmentChange={handleRefreshDepartment}
            onRefresh={() => refreshDepartment(weeklyDepartment)}
            refreshing={refreshingDept === weeklyDepartment}
            onBack={() => setView('map')}
            onSpotClick={handleSpotClick}
          />
        </div>
      </div>
    </div>
  );
}
