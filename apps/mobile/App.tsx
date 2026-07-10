import { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { MapScreen } from './src/screens/MapScreen';
import { WeeklyView } from './src/components/WeeklyView';
import { DetailView } from './src/components/DetailView';
import { useSurfConditions } from './src/hooks/useSurfConditions';
import type { SpotView } from './src/types';
import { theme } from './src/theme';

type ViewName = 'map' | 'weekly' | 'detail';

export default function App() {
  const {
    mapSpots,
    weeklySpots,
    departments,
    loadingCatalog,
    refreshingDept,
    networkError,
    weeklyDepartment,
    setWeeklyDepartment,
    refreshDepartment,
    refreshSpot,
    refreshingSpotSlug,
  } = useSurfConditions();

  const [view, setView] = useState<ViewName>('map');
  const [previousView, setPreviousView] = useState<ViewName>('map');
  const [selectedSpot, setSelectedSpot] = useState<SpotView | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

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
    if (slug) {
      setPreviousView(view);
      setSelectedSpot(spot);
      setSelectedDay(0);
      setView('detail');
      const updated = await refreshSpot(slug);
      if (updated) setSelectedSpot(updated);
      return;
    }
    if (spot.hasScore && !spot.error) {
      setPreviousView(view);
      setSelectedSpot(spot);
      setSelectedDay(0);
      setView('detail');
    }
  }

  function handleSpotClick(spot: SpotView, day = 0) {
    if (!spot.hasScore || spot.error) return;
    setPreviousView(view);
    setSelectedSpot(spot);
    setSelectedDay(day);
    setView('detail');
  }

  function handleRefreshDepartment(code: string) {
    setWeeklyDepartment(code);
    refreshDepartment(code);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {view === 'map' && (
        <MapScreen
          mapSpots={mapSpots}
          departments={departments}
          loadingCatalog={loadingCatalog}
          refreshingDept={refreshingDept}
          networkError={networkError}
          onRefreshDepartment={handleRefreshDepartment}
          onRetry={() => refreshDepartment('64')}
          onSpotClick={handleMapSpotClick}
          onWeekly={() => setView('weekly')}
          refreshingSpotSlug={refreshingSpotSlug}
        />
      )}
      {view === 'weekly' && (
        <WeeklyView
          spots={weeklySpots}
          departments={departments}
          department={weeklyDepartment}
          onDepartmentChange={setWeeklyDepartment}
          onBack={() => setView('map')}
          onSpotClick={handleSpotClick}
        />
      )}
      {view === 'detail' && selectedSpot && (
        <DetailView
          spot={selectedSpot}
          initialDay={selectedDay}
          onBack={() => setView(previousView === 'detail' ? 'map' : previousView)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
});
