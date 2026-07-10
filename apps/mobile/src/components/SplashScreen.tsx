import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function SplashScreen({ message = 'Chargement…' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SurfScore</Text>
      <Text style={styles.subtitle}>France · prévisions surf</Text>
      <ActivityIndicator size="large" color={theme.accent} style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: theme.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: theme.muted, fontSize: 13, marginTop: 6 },
  spinner: { marginTop: 32 },
  message: { color: theme.muted, fontSize: 12, marginTop: 16 },
});
