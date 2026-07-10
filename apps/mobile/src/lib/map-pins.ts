import type { MapPin } from '../types';
import type { SpotView } from '../types';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export function toMapPin(spot: SpotView): MapPin {
  return {
    id: spot.id,
    slug: spot.slug,
    surfForecastSlug: spot.surfForecastSlug,
    name: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    hasScore: spot.hasScore && !spot.error,
    score: spot.score,
  };
}

/** Retire les grosses séries horaires de l'objet carte (détail dans scoredViews). */
export function stripHeavyFields(view: SpotView): SpotView {
  return {
    ...view,
    hourlyScoresFull: undefined,
    tideTimes: undefined,
    tideHeights: undefined,
    hourly: view.hasScore ? view.hourly : [],
  };
}

function pinsInRegion(pins: MapPin[], region: MapRegion, padding = 0.12): MapPin[] {
  const padLat = region.latitudeDelta * padding;
  const padLng = region.longitudeDelta * padding;
  const latMin = region.latitude - region.latitudeDelta / 2 - padLat;
  const latMax = region.latitude + region.latitudeDelta / 2 + padLat;
  const lngMin = region.longitude - region.longitudeDelta / 2 - padLng;
  const lngMax = region.longitude + region.longitudeDelta / 2 + padLng;
  return pins.filter(
    (p) =>
      p.latitude >= latMin &&
      p.latitude <= latMax &&
      p.longitude >= lngMin &&
      p.longitude <= lngMax,
  );
}

/** Limite les marqueurs natifs pour éviter OOM (react-native-maps). */
export function selectMapPins(pins: MapPin[], region: MapRegion): MapPin[] {
  const scored = pins.filter((p) => p.hasScore);
  // Vue France : seulement les spots déjà scorés (pas 375 pins catalogue)
  if (region.latitudeDelta > 3) return scored;
  const visible = pinsInRegion(pins, region);
  return visible.length > 100 ? visible.slice(0, 100) : visible;
}
