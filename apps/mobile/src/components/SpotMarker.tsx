import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { scoreColor } from '../utils/score-color';

interface Props {
  latitude: number;
  longitude: number;
  name: string;
  score: number | null;
  onPress: () => void;
}

export function SpotMarker({ latitude, longitude, name, score, onPress }: Props) {
  const color = scoreColor(score);
  return (
    <Marker coordinate={{ latitude, longitude }} onPress={onPress} title={name}>
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Text style={styles.score}>{score ?? '—'}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, minWidth: 36, alignItems: 'center' },
  score: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
