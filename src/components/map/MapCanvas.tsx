import { useEffect, useRef } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapboxMap } from '@/hooks/useMapboxMap'
import { isMapboxConfigured } from '@/lib/mapboxClient'

type MapCanvasProps = {
  center: [number, number]
  zoom?: number
  style?: string
  className?: string
  onMapReady?: (map: MapboxMap) => void
  onError?: (message: string) => void
}

/**
 * Wrapper générique bas-niveau autour de Mapbox GL JS — sans connaissance du
 * domaine (aucun type Mission/Stop ici), réutilisable par n'importe quel futur
 * module ayant besoin d'une carte.
 */
export function MapCanvas({ center, zoom, style, className, onMapReady, onError }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { map, isLoaded, error } = useMapboxMap(containerRef, { center, zoom, style })

  useEffect(() => {
    if (map && isLoaded) onMapReady?.(map)
  }, [map, isLoaded, onMapReady])

  useEffect(() => {
    if (error) onError?.(error)
  }, [error, onError])

  if (!isMapboxConfigured) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border-subtle bg-surface-card px-6 text-center ${className ?? ''}`}
      >
        <p className="text-body font-medium text-text">Carte non disponible</p>
        <p className="text-label text-text-muted">
          Aucun token Mapbox n'est configuré (VITE_MAPBOX_TOKEN).
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-status-danger/40 bg-status-danger/10 px-6 text-center ${className ?? ''}`}
      >
        <p className="text-body font-medium text-text">La carte n'a pas pu se charger</p>
        <p className="text-label text-text-muted">{error}</p>
      </div>
    )
  }

  return <div ref={containerRef} className={className} />
}
