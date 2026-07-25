import type { GpsPosition, LatLng, Stop } from './types'
import {
  SIDE_MAX_ANGLE_DEG,
  SIDE_MAX_DISTANCE_METERS,
  SIDE_MIN_ANGLE_DEG,
  SIDE_MIN_SPEED_KMH,
} from './config'

/**
 * Calculs GPS purs — aucune API externe. Utilisés par le moteur de mission pour
 * déterminer la proximité des stops et déclencher les changements de statut.
 */

const EARTH_RADIUS_M = 6_371_000

/** Vitesse moyenne supposée (km/h) pour estimer un temps d'arrivée à partir
 *  d'une distance à vol d'oiseau. Configurable — pas de service de routing. */
export const ASSUMED_SPEED_KMH = 30

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

/** Convertit une vitesse m/s (GPS) en km/h. `null` → 0. */
export function metersPerSecondToKmh(mps: number | null): number {
  return mps !== null && Number.isFinite(mps) && mps > 0 ? mps * 3.6 : 0
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

/** Cap initial (0–360°, sens horaire depuis le nord) de `from` vers `to`. */
export function bearingDegrees(from: LatLng, to: LatLng): number {
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const dLng = toRadians(to.lng - from.lng)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

/** Ramène un écart d'angle dans (−180, 180]. */
function signedAngleDiff(a: number, b: number): number {
  let diff = ((a - b + 540) % 360) - 180
  if (diff === -180) diff = 180
  return diff
}

/**
 * Détermine si la résidence se situe à **gauche** ou à **droite** de l'opérateur,
 * à partir de sa position, de son **cap** (heading) et des coordonnées de la
 * résidence. Retourne `null` (→ silence) quand le calcul n'est pas fiable :
 * cap inconnu, trop lent, trop loin, ou angle trop proche de l'axe avant/arrière
 * (ambigu). Calcul purement local, aucune API externe.
 */
export function residenceSide(
  position: GpsPosition,
  target: LatLng,
  distanceMeters: number,
): 'left' | 'right' | null {
  if (position.heading === null || !Number.isFinite(position.heading)) return null
  if (metersPerSecondToKmh(position.speed) < SIDE_MIN_SPEED_KMH) return null
  if (distanceMeters > SIDE_MAX_DISTANCE_METERS) return null

  const diff = signedAngleDiff(bearingDegrees(position, target), position.heading)
  const abs = Math.abs(diff)
  if (abs < SIDE_MIN_ANGLE_DEG || abs > SIDE_MAX_ANGLE_DEG) return null

  return diff > 0 ? 'right' : 'left'
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
