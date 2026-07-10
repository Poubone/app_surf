import { useState } from 'react';
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
  } = useSurfConditions();

  const [view, setView] = useState<ViewName>('map');
  const [previousView, setPreviousView] = useState<ViewName>('map');
  const [selectedSpot, setSelectedSpot] = useState<SpotView | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  function handleSpotClick(spot: SpotView, day = 0) {
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
          onSpotClick={(s) => handleSpotClick(s)}
          onWeekly={() => setView('weekly')}
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
