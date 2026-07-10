import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { getScoreRowForDay, spotForDay } from '../hooks/useSurfConditions';
import { getScoreColor, getScoreLabel } from '../lib/display';
import type { SpotView } from '../types';
import { theme } from '../theme';

export function DetailView({
  spot,
  onBack,
  initialDay = 0,
}: {
  spot: SpotView;
  onBack: () => void;
  initialDay?: number;
}) {
  const [dayIndex, setDayIndex] = useState(initialDay);
  const view = useMemo(() => spotForDay(spot, dayIndex), [spot, dayIndex]);
  const scoreRow = useMemo(() => getScoreRowForDay(spot, dayIndex), [spot, dayIndex]);
  const color = getScoreColor(view.score);

  if (spot.error) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.error}>Données indisponibles : {spot.error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.region}>{view.departmentName}</Text>
      <Text style={styles.name}>{view.name}</Text>

      <View style={styles.scoreBlock}>
        <Text style={[styles.score, { color }]}>{view.score}</Text>
        <Text style={styles.scoreMeta}>/100 · {getScoreLabel(view.score)}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.days}>
        {spot.dayLabels.map((label, i) => (
          <TouchableOpacity
            key={label + i}
            onPress={() => setDayIndex(i)}
            style={[styles.dayChip, dayIndex === i && { borderColor: color }]}
          >
            <Text style={[styles.dayChipText, dayIndex === i && { color }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.stats}>
        <Stat label="Houle" value={`${view.waves.height}m · ${view.waves.period}s`} sub={view.waves.direction} />
        <Stat label="Vent" value={`${view.wind.speed} nds ${view.wind.direction}`} sub={`Raf. ${view.wind.gust}`} />
        <Stat label="Eau" value={`${view.water.temp}°C`} />
        <Stat label="Air" value={`${view.weather.emoji} ${view.weather.temp}°C`} sub={view.weather.condition} />
        <Stat label="Marée" value={view.tide} />
      </View>

      {scoreRow && (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Détail scoring</Text>
          <Text style={styles.breakdownLine}>Houle {scoreRow.scoreBreakdown.swellScore}/50</Text>
          <Text style={styles.breakdownLine}>Vent {scoreRow.scoreBreakdown.windScore}/30 · {scoreRow.scoreBreakdown.windLabel}</Text>
          <Text style={styles.breakdownLine}>Marée {scoreRow.scoreBreakdown.tideScore}/20</Text>
        </View>
      )}

      <View style={styles.hourly}>
        <Text style={styles.breakdownTitle}>Aujourd'hui par heure</Text>
        <View style={styles.hourlyRow}>
          {view.hourly.map((h) => (
            <View key={h.hour} style={styles.hourCell}>
              <Text style={styles.hourLabel}>{h.hour}</Text>
              <Text style={[styles.hourScore, { color: getScoreColor(h.score) }]}>{h.score}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingTop: 48, paddingBottom: 40 },
  back: { color: theme.muted, marginBottom: 16 },
  region: { color: theme.muted, fontSize: 12 },
  name: { color: theme.text, fontSize: 26, fontWeight: '800', marginTop: 4 },
  scoreBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginVertical: 16 },
  score: { fontSize: 56, fontWeight: '800' },
  scoreMeta: { color: theme.muted, fontSize: 14 },
  days: { marginBottom: 16 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  dayChipText: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  stats: { gap: 10, marginBottom: 20 },
  stat: { backgroundColor: theme.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  statLabel: { color: theme.muted, fontSize: 11, marginBottom: 4 },
  statValue: { color: theme.text, fontSize: 15, fontWeight: '600' },
  statSub: { color: theme.muted, fontSize: 12, marginTop: 2 },
  breakdown: { marginBottom: 20 },
  breakdownTitle: { color: theme.text, fontWeight: '700', marginBottom: 8 },
  breakdownLine: { color: theme.muted, fontSize: 13, marginBottom: 4 },
  hourly: { marginTop: 8 },
  hourlyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourCell: { alignItems: 'center', minWidth: 40 },
  hourLabel: { color: theme.muted, fontSize: 10 },
  hourScore: { fontSize: 14, fontWeight: '700' },
  error: { color: '#ff5252', marginTop: 20 },
});
