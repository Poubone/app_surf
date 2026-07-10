import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { bestSpotPerDay } from '../hooks/useSurfConditions';
import { departmentLabel, type DepartmentOption } from '../lib/departments';
import { getScoreColor } from '../lib/display';
import type { SpotView } from '../types';
import { theme } from '../theme';

export function WeeklyView({
  spots,
  departments,
  department,
  onDepartmentChange,
  onBack,
  onSpotClick,
}: {
  spots: SpotView[];
  departments: DepartmentOption[];
  department: string;
  onDepartmentChange: (code: string) => void;
  onBack: () => void;
  onSpotClick: (spot: SpotView, day: number) => void;
}) {
  const dayLabels = spots[0]?.dayLabels ?? [];
  const bestPerDay = bestSpotPerDay(spots);
  const scoredDepts = departments.filter((d) => d.scrapedCount > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Retour carte</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Prévisions 7 jours</Text>
        <Text style={styles.subtitle}>{spots.length} spots</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
          {scoredDepts.map((d) => (
            <TouchableOpacity
              key={d.code}
              onPress={() => onDepartmentChange(d.code)}
              style={[styles.deptChip, department === d.code && styles.deptChipActive]}
            >
              <Text style={[styles.deptChipText, department === d.code && styles.deptChipTextActive]}>
                {departmentLabel(d.code, d.name)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {spots.length > 0 && (
          <View style={styles.dayRow}>
            <View style={styles.nameCol} />
            {dayLabels.map((d, i) => (
              <Text key={d + i} style={[styles.dayLabel, i === 0 && styles.dayToday]}>
                {d}
              </Text>
            ))}
          </View>
        )}
      </View>
      <ScrollView style={styles.body}>
        {spots.length === 0 ? (
          <Text style={styles.empty}>Aucun spot scoré — l'actualisation est peut-être en cours.</Text>
        ) : (
          <>
            <View style={styles.bestRow}>
              <Text style={styles.bestLabel}>Meilleur spot</Text>
              {bestPerDay.map((entry, i) => {
                if (!entry) return <View key={i} style={styles.scoreCell} />;
                const c = getScoreColor(entry.score);
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.scoreCell}
                    onPress={() => onSpotClick(entry.spot, entry.dayIndex)}
                  >
                    <Text style={[styles.bestSpotName, { color: i === 0 ? c : theme.muted }]} numberOfLines={1}>
                      {entry.spot.name.split(' ')[0]}
                    </Text>
                    <View style={[styles.scoreBubble, { borderColor: c, backgroundColor: `${c}22` }]}>
                      <Text style={[styles.scoreText, { color: c }]}>{entry.score}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {spots.map((spot) => (
              <View key={spot.id} style={styles.spotRow}>
                <TouchableOpacity style={styles.nameCol} onPress={() => onSpotClick(spot, 0)}>
                  <Text style={styles.spotName} numberOfLines={1}>
                    {spot.name}
                  </Text>
                </TouchableOpacity>
                {spot.weeklyScores.map((s, i) => {
                  const c = getScoreColor(s);
                  return (
                    <TouchableOpacity key={i} style={styles.scoreCell} onPress={() => onSpotClick(spot, i)}>
                      <View style={[styles.scoreBubble, { borderColor: c, backgroundColor: i === 0 ? `${c}22` : 'transparent' }]}>
                        <Text style={[styles.scoreText, { color: c }]}>{s}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  back: { color: theme.muted, marginBottom: 12 },
  title: { color: theme.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: theme.muted, fontSize: 12, marginTop: 4 },
  deptScroll: { marginTop: 12, marginBottom: 8 },
  deptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  deptChipActive: { borderColor: theme.accent, backgroundColor: 'rgba(0,212,168,0.12)' },
  deptChipText: { color: theme.muted, fontSize: 12 },
  deptChipTextActive: { color: theme.accent },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  nameCol: { width: 88 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 10, color: theme.muted, fontWeight: '700' },
  dayToday: { color: theme.accent },
  body: { flex: 1 },
  empty: { color: theme.muted, textAlign: 'center', marginTop: 40, padding: 16 },
  spotRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  spotName: { color: theme.text, fontSize: 13, fontWeight: '600' },
  scoreCell: { flex: 1, alignItems: 'center' },
  scoreBubble: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 10, fontWeight: '700' },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,168,0.2)',
    backgroundColor: 'rgba(0,212,168,0.06)',
  },
  bestLabel: { width: 88, color: theme.accent, fontSize: 11, fontWeight: '700' },
  bestSpotName: { fontSize: 9, fontWeight: '600', marginBottom: 4, maxWidth: 48, textAlign: 'center' },
});
