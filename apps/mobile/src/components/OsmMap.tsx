import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import MapView, { type Region, UrlTile } from 'react-native-maps';

/** OpenStreetMap tiles — free, no API key (unlike Google Maps). */
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

interface OsmMapProps {
  style?: object;
  initialRegion: Region;
  onRegionChangeComplete?: (region: Region) => void;
  children?: ReactNode;
}

export function OsmMap({ style, initialRegion, onRegionChangeComplete, children }: OsmMapProps) {
  return (
    <MapView
      style={style}
      initialRegion={initialRegion}
      onRegionChangeComplete={onRegionChangeComplete}
      mapType={Platform.OS === 'android' ? 'none' : 'standard'}
      rotateEnabled={false}
    >
      <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />
      {children}
    </MapView>
  );
}
