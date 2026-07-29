import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Map as MapboxMap } from 'mapbox-gl'
import { MapCanvas } from '@/components/map/MapCanvas'
import { STATUS_CONFIG } from '../../domain/status'
import { haversineMeters } from '../../domain/geo'
import type { GpsPosition, Stop } from '../../domain/types'
import { TONE_HEX } from './statusToneColors'
import { boundsFromPoints } from './mapBounds'
import { CompassBadge } from './CompassBadge'
import { MapControls } from './MapControls'
import { FOLLOW_EASE_MS, FOLLOW_MIN_MOVE_METERS, FOLLOW_PITCH, FOLLOW_ZOOM } from './mapCameraConfig'

const ROUTE_SOURCE_ID = 'mission-route'
const ROUTE_LAYER_ID = 'mission-route-line'
/** Repli si ni position GPS ni stop ne sont encore connus (Saint-Jérôme, cf. `?sim=1`). */
const DEFAULT_CENTER: [number, number] = [-74.03, 45.81]
const STYLE_DARK = 'mapbox://styles/mapbox/dark-v11'
const STYLE_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12'

type MissionMapProps = {
  stops: Stop[]
  activeOrdre: number | null
  position: GpsPosition | null
  className?: string
}

/** (Ré)ajoute la source/couche du tracé — appelé aussi après un changement de style. */
function ensureRouteLayer(map: MapboxMap, stops: Stop[]) {
  try {
    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID)
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID)
  } catch {
    // best-effort — la carte peut être en cours de destruction
  }
  if (stops.length < 2) return

  map.addSource(ROUTE_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: stops.map((s) => [s.lng, s.lat]) },
    },
  })
  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: 'line',
    source: ROUTE_SOURCE_ID,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': TONE_HEX.accent, 'line-width': 3, 'line-opacity': 0.8 },
  })
}

function createStopMarkerElement(stop: Stop, isActive: boolean): HTMLDivElement {
  const el = document.createElement('div')
  const color = TONE_HEX[STATUS_CONFIG[stop.status].tone]
  const size = isActive ? 18 : 12
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.borderRadius = '9999px'
  el.style.backgroundColor = color
  el.style.border = isActive ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.6)'
  el.style.boxShadow = isActive ? `0 0 0 4px ${color}59` : 'none'
  return el
}

/** Cercle plein + halo + flèche de cap (masquée si le cap est inconnu). */
function createPositionMarkerElement(): HTMLDivElement {
  const wrapper = document.createElement('div')
  wrapper.style.position = 'relative'
  wrapper.style.width = '28px'
  wrapper.style.height = '28px'

  const halo = document.createElement('div')
  halo.style.position = 'absolute'
  halo.style.inset = '-8px'
  halo.style.borderRadius = '9999px'
  halo.style.backgroundColor = 'rgba(59,130,246,0.25)'
  wrapper.appendChild(halo)

  const dot = document.createElement('div')
  dot.style.position = 'absolute'
  dot.style.inset = '4px'
  dot.style.borderRadius = '9999px'
  dot.style.backgroundColor = TONE_HEX.accent
  dot.style.border = '2px solid #ffffff'
  wrapper.appendChild(dot)

  const arrow = document.createElement('div')
  arrow.dataset.role = 'heading-arrow'
  arrow.style.position = 'absolute'
  arrow.style.left = '50%'
  arrow.style.top = '50%'
  arrow.style.width = '0'
  arrow.style.height = '0'
  arrow.style.borderLeft = '5px solid transparent'
  arrow.style.borderRight = '5px solid transparent'
  arrow.style.borderBottom = `10px solid ${TONE_HEX.accent}`
  arrow.style.transformOrigin = 'center 18px'
  arrow.style.visibility = 'hidden'
  wrapper.appendChild(arrow)

  return wrapper
}

/**
 * Carte de la mission — tracé de la route (ordre des stops), marqueurs colorés
 * par statut, position GPS courante avec halo + flèche de cap, recentrer et
 * bascule sombre/satellite. Composant feature : seul endroit qui connaît le
 * domaine Mission dans le module carte (`MapCanvas`/`useMapboxMap` restent 100%
 * génériques).
 */
export function MissionMap({ stops, activeOrdre, position, className }: MissionMapProps) {
  const [map, setMap] = useState<MapboxMap | null>(null)
  const [isSatellite, setIsSatellite] = useState(false)
  // Uniquement pour le listener `style.load` (enregistré une seule fois, cf. plus
  // bas) — il a besoin des stops les plus récents sans dépendre de `stops` dans
  // son propre effet. Mis à jour hors rendu, jamais lu pendant celui-ci.
  const stopsRef = useRef(stops)
  useEffect(() => {
    stopsRef.current = stops
  }, [stops])
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([])
  const positionMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const lastFollowedRef = useRef<GpsPosition | null>(null)
  const lastBearingRef = useRef(0)
  const [heading, setHeading] = useState<number | null>(null)

  // Clés stables : `distanceMeters`/`etaMinutes` changent à chaque fix GPS, mais
  // ni le tracé ni les marqueurs n'ont besoin d'être reconstruits pour autant —
  // seuls l'ensemble des stops (coordonnées) et leur statut comptent visuellement.
  const routeKey = useMemo(() => stops.map((s) => `${s.ordre}:${s.lat}:${s.lng}`).join('|'), [stops])
  const markersKey = useMemo(
    () => stops.map((s) => `${s.ordre}:${s.status}`).join('|') + `#${activeOrdre ?? ''}`,
    [stops, activeOrdre],
  )

  // Tracé de la route (indépendant du style courant, mais purgé par setStyle).
  useEffect(() => {
    if (!map) return
    ensureRouteLayer(map, stops)
    // `stops` est intentionnellement omis : `routeKey` capture déjà les seuls
    // changements pertinents (ordre/coordonnées), pas chaque nouvelle référence
    // d'objet créée à chaque fix GPS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routeKey])

  useEffect(() => {
    if (!map) return
    const handleStyleLoad = () => ensureRouteLayer(map, stopsRef.current)
    map.on('style.load', handleStyleLoad)
    return () => {
      map.off('style.load', handleStyleLoad)
    }
  }, [map])

  // Marqueurs de stops (persistent à travers les changements de style).
  useEffect(() => {
    if (!map) return
    stopMarkersRef.current.forEach((m) => m.remove())
    stopMarkersRef.current = stops.map((stop) =>
      new mapboxgl.Marker({ element: createStopMarkerElement(stop, stop.ordre === activeOrdre) })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map),
    )
    return () => {
      stopMarkersRef.current.forEach((m) => m.remove())
      stopMarkersRef.current = []
    }
    // `stops` intentionnellement omis, cf. commentaire sur `routeKey` plus haut.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, markersKey, activeOrdre])

  // Marqueur de position courante.
  useEffect(() => {
    if (!map) return

    if (!position) {
      positionMarkerRef.current?.remove()
      positionMarkerRef.current = null
      return
    }

    if (!positionMarkerRef.current) {
      // `setLngLat` AVANT `addTo` : Mapbox GL projette le marqueur dès son ajout
      // à la carte et lève sinon `Cannot read properties of undefined (reading 'lng')`.
      positionMarkerRef.current = new mapboxgl.Marker({ element: createPositionMarkerElement() })
        .setLngLat([position.lng, position.lat])
        .addTo(map)
    }

    const marker = positionMarkerRef.current
    marker.setLngLat([position.lng, position.lat])

    const arrowEl = marker.getElement().querySelector<HTMLDivElement>('[data-role="heading-arrow"]')
    if (arrowEl) {
      if (position.heading === null) {
        arrowEl.style.visibility = 'hidden'
      } else {
        arrowEl.style.visibility = 'visible'
        arrowEl.style.transform = `rotate(${position.heading}deg)`
      }
    }
  }, [map, position])

  useEffect(() => {
    return () => {
      positionMarkerRef.current?.remove()
      positionMarkerRef.current = null
    }
  }, [])

  // Caméra « conduite » : suit la position et le cap en continu (Tesla/Waze/GPS
  // agricole). Le cap est conservé (`lastBearingRef`) tant qu'aucun nouveau cap
  // fiable n'est reçu (immobile) plutôt que de revenir plein nord. Un seuil de
  // déplacement minimal évite un tremblement de caméra quand le GPS bruite à
  // l'arrêt (`FOLLOW_MIN_MOVE_METERS`).
  useEffect(() => {
    if (!map || !position) return
    const last = lastFollowedRef.current
    if (last && haversineMeters(last, position) < FOLLOW_MIN_MOVE_METERS) return
    lastFollowedRef.current = position

    const bearing = position.heading ?? lastBearingRef.current
    lastBearingRef.current = bearing
    setHeading(bearing)

    map.easeTo({
      center: [position.lng, position.lat],
      bearing,
      pitch: FOLLOW_PITCH,
      zoom: FOLLOW_ZOOM,
      duration: FOLLOW_EASE_MS,
    })
  }, [map, position])

  const handleRecenter = () => {
    if (!map) return
    if (position) {
      lastFollowedRef.current = null // force une reprise du suivi au prochain fix
      map.easeTo({
        center: [position.lng, position.lat],
        bearing: lastBearingRef.current,
        pitch: FOLLOW_PITCH,
        zoom: FOLLOW_ZOOM,
        duration: FOLLOW_EASE_MS,
      })
      return
    }
    const bounds = boundsFromPoints(stops.map((s) => [s.lng, s.lat] as [number, number]))
    if (bounds) map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0, pitch: 0, bearing: 0 })
  }

  const handleToggleLayer = () => {
    if (!map) return
    const next = !isSatellite
    setIsSatellite(next)
    map.setStyle(next ? STYLE_SATELLITE : STYLE_DARK)
  }

  const initialCenter: [number, number] = position
    ? [position.lng, position.lat]
    : stops[0]
      ? [stops[0].lng, stops[0].lat]
      : DEFAULT_CENTER

  return (
    // `position` (relative/absolute/fixed) doit venir entièrement de `className` (l'appelant) :
    // le fait de figer `relative` ici en plus d'un `absolute` passé par le parent faisait
    // gagner `relative` dans le CSS généré par Tailwind (déclaré après `.absolute`, même
    // spécificité), donc `inset-0` n'avait plus d'effet de dimensionnement — la carte
    // s'effondrait à la hauteur de son contenu (~28px, l'attribution Mapbox) au lieu de
    // remplir l'écran. `absolute`/`fixed`/`relative` fournissent tous un contexte de
    // positionnement valide pour `CompassBadge`/`MapControls` (enfants `absolute`).
    <div className={`overflow-hidden ${className ?? ''}`}>
      <MapCanvas
        center={initialCenter}
        zoom={FOLLOW_ZOOM}
        pitch={FOLLOW_PITCH}
        style={STYLE_DARK}
        className="size-full"
        onMapReady={setMap}
      />
      <CompassBadge headingDeg={heading} />
      <MapControls onRecenter={handleRecenter} onToggleLayer={handleToggleLayer} isSatellite={isSatellite} />
    </div>
  )
}
