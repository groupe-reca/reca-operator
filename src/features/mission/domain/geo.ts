import type { LatLng, Stop } from './types'

/**
 * Calculs GPS purs — aucune API externe. Utilisés par le moteur de mission pour
 * déterminer la proximité des stops et déclencher les changements de statut.
 */

const EARTH_RADIUS_M = 6_371_000

/** Vitesse moyenne supposée (km/h) pour estimer un temps d'arrivée à partir
 *  d'une distance à vol d'oiseau. Configurable — pas de service de routing. */
export const ASSUMED_SPEED_KMH = 30

/** Seuil d'ETA (minutes) sous lequel un stop passe EN_APPROCHE. */
export const APPROACH_ETA_MINUTES = 10

/** Rayon d'arrivée (mètres) : sous ce seuil, un stop deviendra EN_COURS.
 *  Prévu pour un prochain sprint — non branché dans le moteur. */
export const ARRIVAL_RADIUS_METERS = 20

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Distance à vol d'oiseau entre deux points, en mètres (formule haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** ETA en minutes pour une distance donnée, à la vitesse supposée. */
export function estimateEtaMinutes(
  distanceMeters: number,
  speedKmh: number = ASSUMED_SPEED_KMH,
): number {
  if (speedKmh <= 0) return Infinity
  const metersPerMinute = (speedKmh * 1000) / 60
  return distanceMeters / metersPerMinute
}

export type NearestStop = {
  stop: Stop
  distanceMeters: number
}

/** Le stop le plus proche d'une position (parmi une liste non vide). */
export function nearestStop(position: LatLng, stops: Stop[]): NearestStop | null {
  let best: NearestStop | null = null
  for (const stop of stops) {
    const distanceMeters = haversineMeters(position, stop)
    if (!best || distanceMeters < best.distanceMeters) {
      best = { stop, distanceMeters }
    }
  }
  return best
}
