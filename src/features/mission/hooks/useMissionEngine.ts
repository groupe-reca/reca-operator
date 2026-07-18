import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loadDemoMission } from '../services/routeCsv'
import { useGeolocation } from './useGeolocation'
import { MissionEngine } from '../engine/MissionEngine'
import { haversineMeters } from '../domain/geo'
import type { GpsPosition, LatLng } from '../domain/types'
import type { EngineConfig } from '../domain/config'
import type { ProblemCode } from '../domain/problemCodes'

/**
 * Adaptateur React **mince** autour de `MissionEngine`. Il ne contient aucune
 * logique métier : il instancie le moteur, lui pousse la position GPS et un tick
 * 1 s, charge la tournée, et réexpose le snapshot + les commandes. Toute la
 * logique (machine à états, chronos, tri, journal) vit dans le moteur.
 */

// --- Simulateur GPS (dev only, ?sim=1) -------------------------------------
// Génère une trajectoire synthétique qui parcourt tout le cycle de chaque stop :
// convergence → arrêt sur place (approche + intervention) → éloignement rapide
// (départ). Permet de valider la machine à états sans matériel GPS.
const SIM_ENABLED =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sim')
const SIM_STEP_METERS = 45 // déplacement par tick en mouvement
const SIM_MOVING_SPEED_MPS = 11 // ~40 km/h (> seuil de départ)
const SIM_INTERVENTION_SECONDS = 5 // temps « sur place » avant de repartir

/** Décale un point d'environ ~250 m au nord-est (cible d'éloignement). */
function awayTarget(to: LatLng): LatLng {
  return { lat: to.lat + 0.002, lng: to.lng + 0.002 }
}

/** Rapproche `from` de `to` d'au plus `meters` mètres. */
function moveToward(from: LatLng, to: LatLng, meters: number): LatLng {
  const d = haversineMeters(from, to)
  if (d <= meters || d === 0) return { lat: to.lat, lng: to.lng }
  const t = meters / d
  return { lat: from.lat + (to.lat - from.lat) * t, lng: from.lng + (to.lng - from.lng) * t }
}

type SimState = { pos: LatLng | null; enCoursSeconds: number }

export type UseMissionEngineResult = ReturnType<typeof useMissionEngine>

export function useMissionEngine() {
  // Instance stable du moteur (valeur d'état paresseuse, pas un ref).
  const [engine] = useState(() => new MissionEngine())

  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot)

  // Chargement de la tournée (CSV statique) → moteur.
  const missionQuery = useQuery({
    queryKey: ['demo-mission'],
    queryFn: loadDemoMission,
    staleTime: Infinity,
  })

  const mission = missionQuery.data
  useEffect(() => {
    if (!mission) return
    engine.loadMission(mission)
    // Production (mode dev désactivé) : démarrage auto, aucune action manuelle.
    if (!engine.getConfig().devControls) engine.play()
  }, [engine, mission])

  // GPS réel (désactivé en simulation).
  const gpsActive = snapshot.phase === 'RUNNING' && !SIM_ENABLED
  const geo = useGeolocation(gpsActive)

  useEffect(() => {
    if (!SIM_ENABLED && geo.position) engine.updatePosition(geo.position)
  }, [engine, geo.position])

  // Tick 1 s : avance l'horloge du moteur (+ produit la position simulée).
  const simRef = useRef<SimState>({ pos: null, enCoursSeconds: 0 })
  useEffect(() => {
    const id = window.setInterval(() => {
      if (SIM_ENABLED) engine.updatePosition(nextSimPosition(engine, simRef.current))
      engine.tick(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [engine])

  return {
    snapshot,
    isLoading: missionQuery.isLoading,
    error: missionQuery.error,
    gpsError: geo.error,
    gpsSupported: geo.isSupported,
    devControls: snapshot.config.devControls,
    config: snapshot.config,
    play: () => engine.play(),
    pause: () => engine.pause(),
    stop: () => engine.stop(),
    reportProblem: (code: ProblemCode) => engine.reportProblem(code),
    setConfig: (patch: Partial<EngineConfig>) => engine.setConfig(patch),
  }
}

/** Calcule la prochaine position simulée d'après l'état de la mission active. */
function nextSimPosition(engine: MissionEngine, sim: SimState): GpsPosition {
  const active = engine.getSnapshot().activeMission?.stop
  const now = Date.now()

  if (!active) {
    // Rien à cibler : position lointaine stable en attendant une mission.
    sim.pos ??= { lat: 45.81, lng: -74.03 }
    return { ...sim.pos, accuracy: 5, timestamp: now, speed: 0 }
  }

  const target: LatLng = { lat: active.lat, lng: active.lng }
  sim.pos ??= { lat: target.lat + 0.02, lng: target.lng + 0.02 } // ~2,5 km au départ

  let speed = 0 // reste 0 à l'arrêt sur place (approche + intervention)
  if (active.status === 'EN_ROUTE' || active.status === 'EN_APPROCHE') {
    sim.pos = moveToward(sim.pos, target, SIM_STEP_METERS)
    speed = SIM_MOVING_SPEED_MPS
    sim.enCoursSeconds = 0
  } else if (active.status === 'EN_COURS') {
    sim.enCoursSeconds += 1
    if (sim.enCoursSeconds <= SIM_INTERVENTION_SECONDS) {
      sim.pos = { lat: target.lat, lng: target.lng } // arrêté sur place
    } else {
      sim.pos = moveToward(sim.pos, awayTarget(target), SIM_STEP_METERS) // repart
      speed = SIM_MOVING_SPEED_MPS
    }
  } else {
    // DEPART : on continue de s'éloigner rapidement.
    sim.pos = moveToward(sim.pos, awayTarget(target), SIM_STEP_METERS)
    speed = SIM_MOVING_SPEED_MPS
  }

  return { ...sim.pos, accuracy: 4, timestamp: now, speed }
}
