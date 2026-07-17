import type { GpsPosition } from './types'

/** Formatage d'affichage pour l'écran mission (fr-CA). */

export function formatCoords(position: GpsPosition | null): string {
  if (!position) return '—, —'
  return `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
}

export function formatAccuracy(position: GpsPosition | null): string {
  if (!position) return '± — m'
  return `± ${Math.round(position.accuracy)} m`
}

/** Horloge complète HH:MM:SS. */
export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/** Heure du jour HH:MM (ex. heure de complétion d'un stop). */
export function formatTimeOfDay(ms: number): string {
  return new Date(ms).toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDistance(meters: number | null): string {
  if (meters === null || !Number.isFinite(meters)) return '—'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatEta(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return '—'
  if (minutes < 1) return '< 1 min'
  return `${Math.round(minutes)} min`
}

/** Durée écoulée HH:MM. */
export function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}
