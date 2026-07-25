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

/** Chronomètre MM:SS (compteur intelligent, ex. « 02:31 »). */
export function formatStopwatch(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Sépare une adresse « rue, ville... » en deux lignes d'affichage. Les adresses
 * de la tournée sont « 202 Rue Scott, Saint-Jérôme, QC J7Z 1H1 » : on garde la
 * partie avant la première virgule comme rue, le reste comme ville.
 */
export function splitAddress(adresse: string): { street: string; city: string } {
  const i = adresse.indexOf(',')
  if (i === -1) return { street: adresse.trim(), city: '' }
  return { street: adresse.slice(0, i).trim(), city: adresse.slice(i + 1).trim() }
}
