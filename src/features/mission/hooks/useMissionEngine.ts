import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loadDemoMission } from '../services/routeCsv'
import { useGeolocation } from './useGeolocation'
import {
  APPROACH_ETA_MINUTES,
  ARRIVAL_RADIUS_METERS,
  estimateEtaMinutes,
  haversineMeters,
} from '../domain/geo'
import type { GpsPosition, Mission, MissionPhase, Stop } from '../domain/types'
import type { MissionStatus } from '../domain/status'

/** Ordre de tri des statuts dans la liste : prochaine → en approche → terminées. */
const STATUS_ORDER: Record<MissionStatus, number> = {
  EN_COURS: 0,
  EN_APPROCHE: 1,
  EN_ATTENTE: 2,
  PAUSE: 2,
  ARRET: 2,
  TERMINE: 3,
}

/** Clé de tri secondaire (au sein d'un même statut). */
export type SecondarySort = 'ordre' | 'distance'

function sortStops(stops: Stop[], secondary: SecondarySort): Stop[] {
  return [...stops].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    if (secondary === 'distance') {
      const da = a.distanceMeters ?? Number.POSITIVE_INFINITY
      const db = b.distanceMeters ?? Number.POSITIVE_INFINITY
      if (da !== db) return da - db
    }
    return a.ordre - b.ordre
  })
}

function resetStops(stops: Stop[]): Stop[] {
  return stops.map((stop) => ({
    ...stop,
    status: 'EN_ATTENTE' as MissionStatus,
    distanceMeters: null,
    etaMinutes: null,
    completedAt: null,
  }))
}

/**
 * Recalcule distance / ETA / statut de chaque stop à partir de la position
 * courante. Ne touche pas aux stops déjà TERMINE / EN_COURS (l'arrivée sera
 * gérée dans un prochain sprint — voir ARRIVAL_RADIUS_METERS).
 */
function recomputeStops(stops: Stop[], position: GpsPosition): Stop[] {
  return stops.map((stop) => {
    if (stop.status === 'TERMINE' || stop.status === 'EN_COURS') return stop
    const distanceMeters = haversineMeters(position, stop)
    const etaMinutes = estimateEtaMinutes(distanceMeters)
    const status: MissionStatus =
      etaMinutes <= APPROACH_ETA_MINUTES ? 'EN_APPROCHE' : 'EN_ATTENTE'
    return { ...stop, distanceMeters, etaMinutes, status }
  })
}

// --- Simulation GPS (dev only, activée par ?sim=1) -------------------------
// Permet de vérifier la détection automatique sans matériel GPS : une position
// synthétique se déplace vers le premier stop, déclenchant les EN_APPROCHE.
const SIM_ENABLED =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sim')
const SIM_TRAVEL_SECONDS = 90

function simulatedPosition(target: Stop, runningSeconds: number): GpsPosition {
  // Origine ~9 km au nord-est du premier stop, convergence linéaire vers lui.
  const origin = { lat: target.lat + 0.06, lng: target.lng + 0.09 }
  const t = Math.min(1, runningSeconds / SIM_TRAVEL_SECONDS)
  return {
    lat: origin.lat + (target.lat - origin.lat) * t,
    lng: origin.lng + (target.lng - origin.lng) * t,
    accuracy: 4,
    timestamp: Date.now(),
  }
}

export function useMissionEngine(secondarySort: SecondarySort = 'ordre') {
  const missionQuery = useQuery({
    queryKey: ['demo-mission'],
    queryFn: loadDemoMission,
    staleTime: Infinity,
  })

  const [phase, setPhase] = useState<MissionPhase>('IDLE')
  const [stops, setStops] = useState<Stop[]>([])
  const [now, setNow] = useState(() => Date.now())

  // Chronomètre de mission (temps total). `accumulated` = temps des segments
  // déjà écoulés ; `runStart` = début du segment courant (null si en pause).
  const [accumulated, setAccumulated] = useState(0)
  const [runStart, setRunStart] = useState<number | null>(null)
  const elapsedMs = accumulated + (runStart !== null ? Math.max(0, now - runStart) : 0)
  const runningSeconds = runStart !== null ? Math.max(0, now - runStart) / 1000 : 0

  // Initialise les stops quand la mission (ou une nouvelle mission) est chargée —
  // pattern « ajuster l'état pendant le rendu » plutôt qu'un effet.
  const [syncedMission, setSyncedMission] = useState<Mission | null>(null)
  if (missionQuery.data && missionQuery.data !== syncedMission) {
    setSyncedMission(missionQuery.data)
    setStops(resetStops(missionQuery.data.stops))
  }

  const gpsActive = phase === 'RUNNING'
  const geo = useGeolocation(gpsActive && !SIM_ENABLED)

  // Position courante : réelle, ou simulée en mode dev.
  const position: GpsPosition | null = useMemo(() => {
    if (SIM_ENABLED) {
      if (phase !== 'RUNNING' || stops.length === 0) return null
      return simulatedPosition(stops[0], runningSeconds)
    }
    return geo.position
  }, [phase, stops, runningSeconds, geo.position])

  const positionRef = useRef<GpsPosition | null>(null)
  useEffect(() => {
    positionRef.current = position
  }, [position])

  // Tick 1 s : avance l'horloge/chrono et recalcule le GPS quand ça tourne.
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now())
      if (phase === 'RUNNING' && positionRef.current) {
        setStops((prev) => recomputeStops(prev, positionRef.current!))
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase])

  const play = () => {
    if (phase === 'IDLE' || phase === 'STOPPED') {
      setStops((prev) => resetStops(prev))
    }
    setRunStart((prev) => prev ?? Date.now())
    setPhase('RUNNING')
  }

  const pause = () => {
    setAccumulated((prev) => (runStart !== null ? prev + (Date.now() - runStart) : prev))
    setRunStart(null)
    setPhase('PAUSED')
  }

  const stop = () => {
    setAccumulated(0)
    setRunStart(null)
    setStops((prev) => resetStops(prev))
    setPhase('STOPPED')
  }

  const sortedStops = useMemo(() => sortStops(stops, secondarySort), [stops, secondarySort])

  const completedCount = stops.filter((s) => s.status === 'TERMINE').length
  const nextStop = sortedStops.find((s) => s.status !== 'TERMINE') ?? null

  return {
    mission: missionQuery.data ?? null,
    isLoading: missionQuery.isLoading,
    error: missionQuery.error,
    phase,
    stops: sortedStops,
    position,
    gpsError: geo.error,
    gpsSupported: geo.isSupported,
    now,
    elapsedMs,
    completedCount,
    totalCount: stops.length,
    nextStop,
    play,
    pause,
    stop,
    /** Rayon d'arrivée prévu pour EN_COURS (non branché ce sprint). */
    arrivalRadiusMeters: ARRIVAL_RADIUS_METERS,
  }
}
