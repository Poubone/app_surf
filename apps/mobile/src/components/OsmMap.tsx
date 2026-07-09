import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';

/** OpenStreetMap tiles — free, no API key (unlike Google Maps). */
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

interface OsmMapProps {
  style?: object;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  children?: ReactNode;
}

export function OsmMap({ style, initialRegion, children }: OsmMapProps) {
  return (
    <MapView
      style={style}
      initialRegion={initialRegion}
      mapType={Platform.OS === 'android' ? 'none' : 'standard'}
      rotateEnabled={false}
    >
      <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />
      {children}
    </MapView>
  );
}
