import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { departmentLabel, type DepartmentOption } from '../lib/departments';
import { theme } from '../theme';

export function DepartmentPicker({
  visible,
  departments,
  refreshingDept,
  onSelect,
  onClose,
}: {
  visible: boolean;
  departments: DepartmentOption[];
  refreshingDept: string | null;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const sorted = [...departments].sort((a, b) => {
    if (a.scrapedCount > 0 && b.scrapedCount === 0) return -1;
    if (b.scrapedCount > 0 && a.scrapedCount === 0) return 1;
    return a.name.localeCompare(b.name, 'fr');
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Actualiser un département</Text>
          <Text style={styles.subtitle}>Scores météo pour les spots configurés</Text>
          <ScrollView style={styles.list}>
            {sorted.map((dept) => {
              const disabled = dept.scrapedCount === 0 || refreshingDept !== null;
              const isRefreshing = refreshingDept === dept.code;
              return (
                <TouchableOpacity
                  key={dept.code}
                  disabled={disabled}
                  style={[styles.row, disabled && !isRefreshing && styles.rowDisabled]}
                  onPress={() => onSelect(dept.code)}
                >
                  <View>
                    <Text style={styles.deptName}>{departmentLabel(dept.code, dept.name)}</Text>
                    <Text style={styles.deptMeta}>
                      {dept.catalogCount} spots · {dept.scrapedCount} scorables
                    </Text>
                  </View>
                  <Text style={[styles.action, dept.scrapedCount > 0 && styles.actionActive]}>
                    {isRefreshing ? '…' : dept.scrapedCount > 0 ? 'Actualiser' : '—'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,12,22,0.8)' },
  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  title: { color: theme.text, fontSize: 18, fontWeight: '700' },
  subtitle: { color: theme.muted, fontSize: 12, marginTop: 4, marginBottom: 12 },
  list: { maxHeight: 400 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowDisabled: { opacity: 0.45 },
  deptName: { color: theme.text, fontSize: 15, fontWeight: '600' },
  deptMeta: { color: theme.muted, fontSize: 12, marginTop: 2 },
  action: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  actionActive: { color: theme.accent },
  closeBtn: { marginTop: 12, alignItems: 'center', padding: 12 },
  closeText: { color: theme.muted, fontSize: 14 },
});
