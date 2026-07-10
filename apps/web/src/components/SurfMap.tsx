import { useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { scoreColor } from '../utils/score-color';
import type { SpotConditions } from '../hooks/useSurfConditions';

const PAY_BASQUE_CENTER: [number, number] = [43.45, -1.62];
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function pinIcon(score: number | null) {
  const color = scoreColor(score);
  const label = score ?? '—';
  return L.divIcon({
    className: '',
    html: `<div class="spot-pin" style="background:${color}">${label}</div>`,
    iconSize: [48, 28],
    iconAnchor: [24, 14],
  });
}

export function SurfMap({
  spots,
  selectedId,
  onSelect,
}: {
  spots: SpotConditions[];
  selectedId: string | null;
  onSelect: (spot: SpotConditions) => void;
}) {
  const markers = useMemo(
    () =>
      spots.map((s) => ({
        id: s.spot.spotId,
        lat: s.spot.latitude,
        lng: s.spot.longitude,
        score: s.error ? null : s.currentScore.total,
        data: s,
      })),
    [spots],
  );

  return (
    <div className="map-wrap">
      <MapContainer center={PAY_BASQUE_CENTER} zoom={10} className="map">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url={OSM_TILE_URL} />
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={pinIcon(m.score)}
            eventHandlers={{ click: () => onSelect(m.data) }}
            opacity={selectedId && selectedId !== m.id ? 0.75 : 1}
          />
        ))}
      </MapContainer>
      <style>{`
        .map-wrap { flex: 1; min-width: 0; position: relative; }
        .map { width: 100%; height: 100%; }
      `}</style>
    </div>
  );
}
