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
  onPress: () => void;
}

export function SpotMarker({ latitude, longitude, name, score, hasScore, onPress }: Props) {
  const color = hasScore && score != null ? getScoreColor(score) : theme.unscored;
  const label = hasScore && score != null ? String(score) : '·';

  return (
    <Marker coordinate={{ latitude, longitude }} onPress={onPress} title={name}>
      <View
        style={[
          styles.pin,
          {
            backgroundColor: hasScore ? `${color}33` : 'rgba(255,255,255,0.08)',
            borderColor: color,
            minWidth: hasScore ? 36 : 24,
            minHeight: hasScore ? 36 : 24,
          },
        ]}
      >
        <Text style={[styles.score, { color: hasScore ? color : theme.unscored }]}>{label}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  score: { fontWeight: '700', fontSize: 11 },
});
