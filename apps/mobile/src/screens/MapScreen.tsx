import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { OsmMap } from '../components/OsmMap';
import { SpotMarker } from '../components/SpotMarker';
import { DepartmentPicker } from '../components/DepartmentPicker';
import { NetworkError } from '../components/NetworkError';
import type { DepartmentOption } from '../lib/departments';
import type { SpotView } from '../types';
import { theme, FRANCE_REGION } from '../theme';

export function MapScreen({
  mapSpots,
  departments,
  loadingCatalog,
  refreshingDept,
  networkError,
  onRefreshDepartment,
  onSpotClick,
  onWeekly,
  onRetry,
}: {
  mapSpots: SpotView[];
  departments: DepartmentOption[];
  loadingCatalog: boolean;
  refreshingDept: string | null;
  networkError: boolean;
  onRefreshDepartment: (code: string) => void;
  onSpotClick: (spot: SpotView) => void;
  onWeekly: () => void;
  onRetry: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const scoredCount = mapSpots.filter((s) => s.hasScore && !s.error).length;

  if (networkError && mapSpots.length === 0) {
    return <NetworkError onRetry={onRetry} />;
  }

  return (
    <View style={styles.container}>
      <OsmMap style={styles.map} initialRegion={FRANCE_REGION}>
        {mapSpots.map((spot) => (
          <SpotMarker
            key={spot.id}
            latitude={spot.latitude}
            longitude={spot.longitude}
            name={spot.name}
            score={spot.hasScore ? spot.score : null}
            hasScore={spot.hasScore && !spot.error}
            onPress={() => {
              if (spot.hasScore && !spot.error) onSpotClick(spot);
            }}
          />
        ))}
      </OsmMap>

      {loadingCatalog && mapSpots.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Chargement carte…</Text>
        </View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SurfScore</Text>
          <Text style={styles.subtitle}>
            France · {mapSpots.length} spots · {scoredCount} scorés
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => setPickerOpen(true)}
            disabled={loadingCatalog && !refreshingDept}
          >
            <Text style={styles.btnText}>{refreshingDept ? '…' : 'Actualiser'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnAccent]} onPress={onWeekly}>
            <Text style={[styles.btnText, styles.btnAccentText]}>Semaine</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>Excellent · Bon · Moyen · Faible · Non scoré</Text>
      </View>

      <DepartmentPicker
        visible={pickerOpen}
        departments={departments}
        refreshingDept={refreshingDept}
        onSelect={(code) => {
          setPickerOpen(false);
          onRefreshDepartment(code);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7,12,22,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: { color: theme.muted, marginTop: 12 },
  header: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { color: theme.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: theme.muted, fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  btnAccent: { backgroundColor: 'rgba(0,212,168,0.15)', borderColor: 'rgba(0,212,168,0.3)' },
  btnText: { color: theme.text, fontWeight: '600', fontSize: 13 },
  btnAccentText: { color: theme.accent },
  legend: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(14,23,36,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  legendText: { color: theme.muted, fontSize: 10 },
});
