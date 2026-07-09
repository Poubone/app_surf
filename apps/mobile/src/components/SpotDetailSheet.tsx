import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { HourlyScoreChart } from './HourlyScoreChart';
import type { SpotConditions } from '../hooks/useSurfConditions';

export function SpotDetailSheet({ data, onClose }: { data: SpotConditions; onClose: () => void }) {
  const { spot, currentScore, hourlyScores, error, tideUnavailable } = data;

  return (
    <Modal animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity onPress={onClose} style={styles.close}>
            <Text>✕</Text>
          </TouchableOpacity>
          <ScrollView>
            <Text style={styles.name}>{spot.name}</Text>
            {error ? (
              <Text style={styles.error}>Données indisponibles : {error}</Text>
            ) : (
              <>
                <Text style={styles.score}>{currentScore.total}/100</Text>
                <Text style={styles.badge}>{currentScore.windLabel}</Text>
                {tideUnavailable && <Text style={styles.warn}>Marée indisponible</Text>}
                <HourlyScoreChart data={hourlyScores} />
                {spot.descriptionFr && <Text style={styles.desc}>{spot.descriptionFr}</Text>}
                <Text style={styles.meta}>Fond : {spot.bottomType} · Niveau : {spot.level}</Text>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '75%', padding: 20 },
  close: { alignSelf: 'flex-end' },
  name: { fontSize: 22, fontWeight: '700' },
  score: { fontSize: 48, fontWeight: '800', marginVertical: 8 },
  badge: { fontSize: 14, color: '#2563EB', fontWeight: '600', marginBottom: 12 },
  warn: { color: '#F97316', marginBottom: 8 },
  desc: { marginTop: 16, lineHeight: 20, color: '#444' },
  meta: { marginTop: 12, color: '#888', fontSize: 13 },
  error: { color: '#EF4444', marginTop: 12 },
});
