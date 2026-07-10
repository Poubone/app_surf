import { useCallback, useEffect, useState } from 'react';
import { BackHandler, InteractionManager, Platform, View, StyleSheet, StatusBar } from 'react-native';
import { MapScreen } from './src/screens/MapScreen';
import { WeeklyView } from './src/components/WeeklyView';
import { DetailView } from './src/components/DetailView';
import { SplashScreen } from './src/components/SplashScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useSurfConditions } from './src/hooks/useSurfConditions';
import type { SpotView } from './src/types';
import { theme } from './src/theme';

type ViewName = 'map' | 'weekly' | 'detail';

function AppContent() {
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
    resolveSpotDetail,
  } = useSurfConditions();

  const [view, setView] = useState<ViewName>('map');
  const [previousView, setPreviousView] = useState<ViewName>('map');
  const [selectedSpot, setSelectedSpot] = useState<SpotView | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (loadingCatalog) {
      setMapReady(false);
      return;
    }
    // Android : carte WebView Leaflet, pas besoin d'attendre react-native-maps
    if (Platform.OS === 'android') {
      setMapReady(true);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => setMapReady(true), 600);
    });
    return () => {
      task.cancel();
      if (timer) clearTimeout(timer);
    };
  }, [loadingCatalog]);

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

  const detailSpot = selectedSpot ? resolveSpotDetail(selectedSpot) : null;

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

  function handleWeeklySpotClick(spot: SpotView, day = 0) {
    setPreviousView(view);
    setSelectedSpot(spot);
    setSelectedDay(day);
    setView('detail');
  }

  function handleRefreshDepartment(code: string) {
    setWeeklyDepartment(code);
    refreshDepartment(code);
  }

  const goBack = useCallback(() => {
    if (view === 'detail') {
      setView(previousView === 'detail' ? 'map' : previousView);
    } else if (view === 'weekly') {
      setView('map');
    }
  }, [view, previousView]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'map') return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [view, goBack]);

  if (loadingCatalog) {
    return <SplashScreen message="Chargement de la carte…" />;
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
          mapReady={mapReady}
        />
      )}
      {view === 'weekly' && (
        <WeeklyView
          spots={weeklySpots}
          departments={departments}
          department={weeklyDepartment}
          onDepartmentChange={handleRefreshDepartment}
          onRefresh={() => refreshDepartment(weeklyDepartment)}
          refreshing={refreshingDept === weeklyDepartment}
          onBack={goBack}
          onSpotClick={handleWeeklySpotClick}
        />
      )}
      {view === 'detail' && detailSpot && (
        <DetailView
          spot={detailSpot}
          initialDay={selectedDay}
          onBack={goBack}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
});
