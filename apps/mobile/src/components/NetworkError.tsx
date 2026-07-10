import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';

export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pas de connexion</Text>
      <Text style={styles.sub}>Connecte-toi pour voir les conditions</Text>
      <TouchableOpacity style={styles.btn} onPress={onRetry}>
        <Text style={styles.btnText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: theme.bg },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: theme.text },
  sub: { color: theme.muted, marginBottom: 24 },
  btn: { backgroundColor: theme.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: theme.bg, fontWeight: '600' },
});
