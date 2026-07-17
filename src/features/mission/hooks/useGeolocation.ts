import { useEffect, useRef, useState } from 'react'
import type { GpsPosition } from '../domain/types'

type GeolocationState = {
  position: GpsPosition | null
  error: string | null
  isSupported: boolean
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

  useEffect(() => {
    if (!enabled || !isSupported) return

    const handleSuccess = (pos: GeolocationPosition) => {
      setError(null)
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      })
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
