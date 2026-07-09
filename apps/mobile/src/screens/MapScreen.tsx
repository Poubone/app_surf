import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { OsmMap } from '../components/OsmMap';
import { SpotMarker } from '../components/SpotMarker';
import { SpotDetailSheet } from '../components/SpotDetailSheet';
import { NetworkError } from '../components/NetworkError';
import { useSurfConditions, type SpotConditions } from '../hooks/useSurfConditions';

const PAY_BASQUE_REGION = {
  latitude: 43.45,
  longitude: -1.62,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

export function MapScreen() {
  const { spots, loading, networkError, refresh } = useSurfConditions();
  const [selected, setSelected] = useState<SpotConditions | null>(null);

  if (networkError) return <NetworkError onRetry={refresh} />;
  if (loading) return <ActivityIndicator style={styles.loader} size="large" />;

  return (
    <View style={styles.container}>
      <OsmMap style={styles.map} initialRegion={PAY_BASQUE_REGION}>
        {spots.map((s) => (
          <SpotMarker
            key={s.spot.spotId}
            latitude={s.spot.latitude}
            longitude={s.spot.longitude}
            name={s.spot.name}
            score={s.error ? null : s.currentScore.total}
            onPress={() => setSelected(s)}
          />
        ))}
      </OsmMap>
      <TouchableOpacity style={styles.refresh} onPress={refresh}>
        <Text style={styles.refreshText}>Actualiser</Text>
      </TouchableOpacity>
      <View style={styles.legend}>
        <Text style={styles.legendText}>≥60 Bon · 30–59 Moyen · &lt;30 Mauvais</Text>
        <Text style={styles.osmCredit}>© OpenStreetMap</Text>
      </View>
      {selected && <SpotDetailSheet data={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  refresh: { position: 'absolute', top: 48, right: 16, backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  refreshText: { fontWeight: '600' },
  legend: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8 },
  legendText: { fontSize: 12 },
  osmCredit: { fontSize: 10, color: '#888', marginTop: 2 },
});
