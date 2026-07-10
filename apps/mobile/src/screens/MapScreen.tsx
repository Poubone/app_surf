import { useMemo, useState } from 'react';
import { Platform, View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import type { Region } from 'react-native-maps';
import { LeafletMap } from '../components/LeafletMap';
import { OsmMap } from '../components/OsmMap';
import { SpotMarker } from '../components/SpotMarker';
import { DepartmentPicker } from '../components/DepartmentPicker';
import { NetworkError } from '../components/NetworkError';
import type { DepartmentOption } from '../lib/departments';
import { selectMapPins, toMapPin } from '../lib/map-pins';
import type { MapPin, SpotView } from '../types';
import { theme, FRANCE_REGION } from '../theme';

/** Android : WebView Leaflet (react-native-maps crash à l'init). iOS : carte native. */
const USE_LEAFLET_MAP = Platform.OS === 'android';

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
  refreshingSpotSlug,
  mapReady,
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
  refreshingSpotSlug: string | null;
  mapReady: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [region, setRegion] = useState<Region>(FRANCE_REGION);
  const scoredCount = mapSpots.filter((s) => s.hasScore && !s.error).length;

  const allPins = useMemo(() => mapSpots.map(toMapPin), [mapSpots]);
  const visiblePins = useMemo(
    () => (USE_LEAFLET_MAP ? allPins : selectMapPins(allPins, region)),
    [allPins, region],
  );
  const spotById = useMemo(() => new Map(mapSpots.map((s) => [s.id, s])), [mapSpots]);

  const zoomHint =
    scoredCount === 0 && mapReady && allPins.length === 0
      ? 'Chargement des spots…'
      : scoredCount === 0 && mapReady
        ? 'Points gris = catalogue · Actualiser pour scorer'
        : !USE_LEAFLET_MAP && region.latitudeDelta <= 3 && allPins.length - visiblePins.length > 20
          ? `Zoomez pour voir plus de spots (${visiblePins.length} affichés)`
          : !USE_LEAFLET_MAP && region.latitudeDelta > 3 && allPins.length > scoredCount
            ? 'Spots non scorés visibles en zoomant'
            : null;

  if (networkError && mapSpots.length === 0) {
    return <NetworkError onRetry={onRetry} />;
  }

  function handlePinPress(pinOrId: MapPin | string) {
    const id = typeof pinOrId === 'string' ? pinOrId : pinOrId.id;
    const spot = spotById.get(id);
    if (spot) onSpotClick(spot);
  }

  const showMap = mapReady || USE_LEAFLET_MAP;

  return (
    <View style={styles.container}>
      {showMap ? (
        USE_LEAFLET_MAP ? (
          <LeafletMap pins={allPins} onPinPress={handlePinPress} />
        ) : (
          <OsmMap
            style={styles.map}
            initialRegion={FRANCE_REGION}
            onRegionChangeComplete={setRegion}
          >
            {visiblePins.map((pin) => {
              const slug = pin.surfForecastSlug ?? pin.slug;
              const isRefreshing = refreshingSpotSlug === slug;
              return (
                <SpotMarker
                  key={pin.id}
                  latitude={pin.latitude}
                  longitude={pin.longitude}
                  name={pin.name}
                  score={pin.hasScore ? pin.score : null}
                  hasScore={pin.hasScore}
                  loading={isRefreshing}
                  onPress={() => handlePinPress(pin)}
                />
              );
            })}
          </OsmMap>
        )
      ) : (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      )}

      {loadingCatalog && mapSpots.length === 0 && showMap && (
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
        <Text style={styles.legendText}>
          {!showMap
            ? 'Initialisation carte…'
            : zoomHint ?? 'Excellent · Bon · Moyen · Faible · Non scoré'}
        </Text>
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#0a1018',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    maxWidth: '90%',
  },
  legendText: { color: theme.muted, fontSize: 10, textAlign: 'center' },
});
