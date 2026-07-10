import { useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { getScoreColor } from '../lib/display';
import type { SpotView } from '../types';

const PAY_BASQUE_CENTER: [number, number] = [43.45, -1.62];
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function markerIcon(spot: SpotView, isSelected: boolean) {
  const color = getScoreColor(spot.score);
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      ${isSelected ? `<div style="position:absolute;width:56px;height:56px;border-radius:50%;background:${color};opacity:0.15;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
      <div style="
        width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:0.65rem;font-family:'Space Mono',monospace;
        background:${isSelected ? color : color + '33'};
        border:2px solid ${color};
        color:${isSelected ? '#070c16' : color};
        box-shadow:0 0 16px ${color}66;
        transform:scale(${isSelected ? 1.15 : 1});
        transition:transform 0.2s;
      ">${spot.score}</div>
      <span style="
        font-size:10px;font-weight:600;padding:2px 6px;border-radius:6px;white-space:nowrap;
        background:rgba(7,12,22,0.85);color:${isSelected ? color : 'rgba(232,237,245,0.8)'};
        font-family:'Outfit',sans-serif;border:1px solid ${isSelected ? color : 'rgba(255,255,255,0.1)'};
      ">${spot.name}</span>
    </div>`;

  return L.divIcon({
    className: '',
    html,
    iconSize: [80, 56],
    iconAnchor: [40, 28],
  });
}

export function SurfMap({
  spots,
  selectedId,
  onSelect,
}: {
  spots: SpotView[];
  selectedId: string | null;
  onSelect: (spot: SpotView) => void;
}) {
  const markers = useMemo(() => spots.filter((s) => !s.error), [spots]);

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer center={PAY_BASQUE_CENTER} zoom={10} className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url={DARK_TILE_URL}
        />
        {markers.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.latitude, spot.longitude]}
            icon={markerIcon(spot, selectedId === spot.id)}
            eventHandlers={{ click: () => onSelect(spot) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
