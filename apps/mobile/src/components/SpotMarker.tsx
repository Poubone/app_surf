import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { getScoreColor } from '../lib/display';
import { theme } from '../theme';

interface Props {
  latitude: number;
  longitude: number;
  name: string;
  score: number | null;
  hasScore: boolean;
  loading?: boolean;
  onPress: () => void;
}

export function SpotMarker({ latitude, longitude, name, score, hasScore, loading, onPress }: Props) {
  const [tracks, setTracks] = useState(loading ?? false);
  const color = hasScore && score != null ? getScoreColor(score) : theme.unscored;
  const label = loading ? '…' : hasScore && score != null ? String(score) : '';

  useEffect(() => {
    if (loading) {
      setTracks(true);
      return;
    }
    const t = setTimeout(() => setTracks(false), 300);
    return () => clearTimeout(t);
  }, [loading, score, hasScore]);

  // Spot non scoré : point minimal (pas de Text → bitmap plus léger)
  if (!hasScore) {
    return (
      <Marker
        coordinate={{ latitude, longitude }}
        onPress={onPress}
        tracksViewChanges={false}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.dot} />
      </Marker>
    );
  }

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      onPress={onPress}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        style={[
          styles.pin,
          {
            backgroundColor: `${color}33`,
            borderColor: color,
          },
        ]}
      >
        <Text style={[styles.score, { color }]}>{label}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(232,237,245,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  score: { fontWeight: '700', fontSize: 10 },
});
