import { useEffect, useRef, useState } from 'react'
import { bearingDegrees, haversineMeters } from '../domain/geo'
import type { GpsPosition } from '../domain/types'

type GeolocationState = {
  position: GpsPosition | null
  error: string | null
  isSupported: boolean
}

/**
 * Vitesse dérivée (m/s) de deux positions successives quand l'appareil ne
 * fournit pas `coords.speed`. Retourne null si indéterminable.
 */
function deriveSpeed(prev: GpsPosition | null, pos: GeolocationPosition): number | null {
  if (!prev) return null
  const dtSeconds = (pos.timestamp - prev.timestamp) / 1000
  if (dtSeconds <= 0) return null
  const meters = haversineMeters(prev, { lat: pos.coords.latitude, lng: pos.coords.longitude })
  return meters / dtSeconds
}

/**
 * Cap dérivé (0–360°) de la direction de déplacement quand l'appareil ne fournit
 * pas `coords.heading`. Retourne null si le déplacement est trop faible (bruit).
 */
function deriveHeading(prev: GpsPosition | null, pos: GeolocationPosition): number | null {
  if (!prev) return null
  const to = { lat: pos.coords.latitude, lng: pos.coords.longitude }
  if (haversineMeters(prev, to) < 2) return null
  return bearingDegrees(prev, to)
}

/**
 * Surveille la position GPS de l'appareil via `watchPosition` tant que `enabled`
 * est vrai. La position la plus récente est conservée et relue par le moteur de
 * mission à chaque tick. Aucune API externe : uniquement la Geolocation API.
 */
export function useGeolocation(enabled: boolean): GeolocationState {
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const [position, setPosition] = useState<GpsPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastRef = useRef<GpsPosition | null>(null)

  useEffect(() => {
    if (!enabled || !isSupported) return

    const handleSuccess = (pos: GeolocationPosition) => {
      setError(null)
      const next: GpsPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
        speed: pos.coords.speed ?? deriveSpeed(lastRef.current, pos),
        heading: pos.coords.heading ?? deriveHeading(lastRef.current, pos),
      }
      lastRef.current = next
      setPosition(next)
    }

    const handleError = (err: GeolocationPositionError) => {
      setError(err.message || 'Position GPS indisponible.')
    }

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10_000,
    })

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [enabled, isSupported])

  return { position, error, isSupported }
}
