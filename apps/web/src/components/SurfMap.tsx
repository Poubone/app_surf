import { useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { getScoreColor } from '../lib/display';
import type { SpotView } from '../types';

const FRANCE_CENTER: [number, number] = [46.5, 2.5];
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const UNSCORED_COLOR = 'rgba(232,237,245,0.35)';

function markerIcon(spot: SpotView, isSelected: boolean) {
  const hasScore = spot.hasScore && !spot.error;
  const color = hasScore ? getScoreColor(spot.score) : UNSCORED_COLOR;
  const label = hasScore ? String(spot.score) : '·';

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      ${isSelected && hasScore ? `<div style="position:absolute;width:56px;height:56px;border-radius:50%;background:${color};opacity:0.15;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
      <div style="
        width:${hasScore ? 40 : 28}px;height:${hasScore ? 40 : 28}px;border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:${hasScore ? '0.65rem' : '1rem'};font-family:'Space Mono',monospace;
        background:${isSelected && hasScore ? color : hasScore ? color + '33' : 'rgba(255,255,255,0.06)'};
        border:2px solid ${color};
        color:${isSelected && hasScore ? '#070c16' : hasScore ? color : 'rgba(232,237,245,0.5)'};
        box-shadow:${hasScore ? `0 0 16px ${color}66` : 'none'};
        transform:scale(${isSelected ? 1.15 : 1});
        transition:transform 0.2s;
      ">${label}</div>
      ${isSelected ? `<span style="
        font-size:10px;font-weight:600;padding:2px 6px;border-radius:6px;white-space:nowrap;
        background:rgba(7,12,22,0.85);color:${hasScore ? color : 'rgba(232,237,245,0.8)'};
        font-family:'Outfit',sans-serif;border:1px solid ${isSelected ? color : 'rgba(255,255,255,0.1)'};
      ">${spot.name}</span>` : ''}
    </div>`;

  return L.divIcon({
    className: '',
    html,
    iconSize: [80, isSelected ? 56 : 32],
    iconAnchor: [40, isSelected ? 28 : 14],
  });
}

export function SurfMap({
  spots,
  selectedId,
  onSelect,
  fitFrance = true,
}: {
  spots: SpotView[];
  selectedId: string | null;
  onSelect: (spot: SpotView) => void;
  fitFrance?: boolean;
}) {
  const markers = useMemo(() => spots, [spots]);
  const center = fitFrance ? FRANCE_CENTER : [43.45, -1.62] as [number, number];
  const zoom = fitFrance ? 6 : 10;

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer center={center} zoom={zoom} className="h-full w-full" zoomControl={false}>
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
