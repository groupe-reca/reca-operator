import {
  ARRIVAL_RADIUS_METERS,
  APPROACH_DELAY_MS,
  DEPART_DELAY_MS,
  DEPART_SPEED_KMH,
} from '../domain/config'
import { estimateEtaMinutes, haversineMeters, metersPerSecondToKmh } from '../domain/geo'
import type { GpsPosition, Mission, MissionPhase, Stop } from '../domain/types'
import type { MissionStatus } from '../domain/status'
import type { MissionLogEntry } from '../domain/log'
import type { ProblemCode } from '../domain/problemCodes'
import { attentionNotesFor } from '../services/attentionFixtures'

/**
 * MissionEngine — **service autonome, sans React**, cœur de l'application.
 *
 * Responsable de TOUTE la logique : réception de la position GPS, calcul des
 * distances, tri par proximité, machine à états automatique, compteurs /
 * chronomètres et journal des temps. L'interface ne fait que pousser les entrées
 * (`updatePosition`, `tick`, commandes) et lire `getSnapshot()`. Aucune logique
 * métier « déneigement » ici : tout reste générique pour la plateforme Signa.
 *
 * Le temps est mesuré par une **horloge virtuelle** (`clock`) qui n'avance que
 * pendant la phase RUNNING : la pause fige donc naturellement tous les chronos et
 * comptes à rebours.
 */

/** Vue immuable exposée à l'UI. */
export type MissionSnapshot = {
  phase: MissionPhase
  activeMission: ActiveMissionView | null
  otherStops: Stop[]
  counter: CounterView
  log: MissionLogEntry[]
  completedCount: number
  totalCount: number
  position: GpsPosition | null
}

export type ActiveMissionView = {
  stop: Stop
  /** Prochain état attendu de la machine (null si état final). */
  nextStatus: MissionStatus | null
  /** Consignes ATTENTION (fictives ce sprint). */
  attention: string[]
}

export type CounterView = {
  status: MissionStatus
  elapsedMs: number
  /** Cible / maximum du compte à rebours (ms), null si ouvert. */
  targetMs: number | null
}

/** États « engagés » : un seul stop peut les porter à la fois. */
const ENGAGED: ReadonlySet<MissionStatus> = new Set<MissionStatus>([
  'EN_ROUTE',
  'EN_APPROCHE',
  'EN_COURS',
  'DEPART',
])

/** États finaux : exclus de la sélection de mission active. */
const FINAL: ReadonlySet<MissionStatus> = new Set<MissionStatus>(['TERMINE', 'NON_TERMINE'])

const NEXT_STATUS: Partial<Record<MissionStatus, MissionStatus>> = {
  EN_ROUTE: 'EN_APPROCHE',
  EN_APPROCHE: 'EN_COURS',
  EN_COURS: 'DEPART',
  DEPART: 'TERMINE',
}

/** Chronos (en unités d'horloge virtuelle) du stop actuellement actif. */
type ActiveTimers = {
  ordre: number
  travelStartClock: number
  arrivedClock: number | null
  approachStartClock: number | null
  interventionStartClock: number | null
  departStartClock: number | null
  /** Heure murale d'arrivée (Date.now) pour le journal. */
  arrivedAtWall: number | null
}

type Listener = () => void

const EMPTY_SNAPSHOT: MissionSnapshot = {
  phase: 'IDLE',
  activeMission: null,
  otherStops: [],
  counter: { status: 'EN_ATTENTE', elapsedMs: 0, targetMs: null },
  log: [],
  completedCount: 0,
  totalCount: 0,
  position: null,
}

export class MissionEngine {
  private phase: MissionPhase = 'IDLE'
  private stops: Stop[] = []
  private position: GpsPosition | null = null
  private log: MissionLogEntry[] = []

  private clock = 0
  private lastTickMs: number | null = null
  private timers: ActiveTimers | null = null

  private listeners = new Set<Listener>()
  private snapshot: MissionSnapshot = EMPTY_SNAPSHOT

  // --- Abonnement (useSyncExternalStore) -----------------------------------

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): MissionSnapshot => this.snapshot

  // --- Commandes -----------------------------------------------------------

  loadMission(mission: Mission): void {
    this.stops = mission.stops.map(resetStop)
    this.resetRuntime()
    this.emit()
  }

  play(): void {
    if (this.phase === 'IDLE' || this.phase === 'STOPPED') {
      this.stops = this.stops.map(resetStop)
      this.clock = 0
      this.timers = null
      this.log = []
    }
    this.lastTickMs = null
    this.phase = 'RUNNING'
    this.evaluate()
    this.emit()
  }

  pause(): void {
    if (this.phase !== 'RUNNING') return
    this.phase = 'PAUSED'
    this.lastTickMs = null
    this.emit()
  }

  stop(): void {
    this.stops = this.stops.map(resetStop)
    this.resetRuntime()
    this.phase = 'STOPPED'
    this.emit()
  }

  /** Signale un problème sur la mission active : passe NON_TERMINE + journalise. */
  reportProblem(code: ProblemCode): void {
    const active = this.activeStop()
    if (!active || !this.timers) return

    const travelMs = this.travelMsSoFar()
    const interventionMs = this.interventionMsSoFar()
    this.log.push({
      ordre: active.ordre,
      adresse: active.adresse,
      arrivedAt: this.timers.arrivedAtWall,
      departedAt: Date.now(),
      travelMs,
      interventionMs,
      outcome: 'NON_TERMINE',
      problemCode: code,
    })

    active.status = 'NON_TERMINE'
    active.problemCode = code
    active.completedAt = Date.now()
    this.timers = null
    this.evaluate()
    this.emit()
  }

  /** Nouvelle position GPS reçue de l'appareil (ou du simulateur). */
  updatePosition(position: GpsPosition): void {
    this.position = position
    if (this.phase === 'RUNNING') {
      this.recomputeDistances()
      this.evaluate()
    }
    this.emit()
  }

  /** Tick périodique (1 s) : avance l'horloge virtuelle et réévalue. */
  tick(nowMs: number): void {
    if (this.phase !== 'RUNNING') return
    if (this.lastTickMs !== null) {
      this.clock += Math.max(0, nowMs - this.lastTickMs)
    }
    this.lastTickMs = nowMs
    this.evaluate()
    this.emit()
  }

  // --- Machine à états -----------------------------------------------------

  private evaluate(): void {
    if (this.phase !== 'RUNNING' || !this.position) return

    this.selectActiveStop()

    const active = this.activeStop()
    if (!active) return

    const distance = active.distanceMeters ?? Number.POSITIVE_INFINITY
    const speedKmh = metersPerSecondToKmh(this.position.speed)
    const timers = this.timers!

    switch (active.status) {
      case 'EN_ROUTE':
        if (distance <= ARRIVAL_RADIUS_METERS) {
          active.status = 'EN_APPROCHE'
          timers.arrivedClock = this.clock
          timers.arrivedAtWall = Date.now()
          timers.approachStartClock = this.clock
        }
        break

      case 'EN_APPROCHE':
        if (distance > ARRIVAL_RADIUS_METERS) {
          // Ressorti du rayon avant la fin du rebours : on repart EN_ROUTE.
          active.status = 'EN_ROUTE'
          timers.arrivedClock = null
          timers.arrivedAtWall = null
          timers.approachStartClock = null
        } else if (this.clock - (timers.approachStartClock ?? this.clock) >= APPROACH_DELAY_MS) {
          active.status = 'EN_COURS'
          timers.interventionStartClock = this.clock
        }
        break

      case 'EN_COURS':
        if (distance > ARRIVAL_RADIUS_METERS && speedKmh > DEPART_SPEED_KMH) {
          active.status = 'DEPART'
          timers.departStartClock = this.clock
        }
        break

      case 'DEPART':
        if (distance <= ARRIVAL_RADIUS_METERS) {
          // Revenu sur place : l'intervention reprend.
          active.status = 'EN_COURS'
          timers.departStartClock = null
        } else if (this.clock - (timers.departStartClock ?? this.clock) >= DEPART_DELAY_MS) {
          this.completeActive()
        }
        break

      default:
        break
    }
  }

  /**
   * Choisit / met à jour la mission active. Tant qu'aucun stop n'est engagé
   * au-delà de EN_ROUTE, la plus proche (non finale) devient la cible — l'app
   * s'adapte au parcours réel de l'opérateur.
   */
  private selectActiveStop(): void {
    const engaged = this.stops.find(
      (s) => ENGAGED.has(s.status) && s.status !== 'EN_ROUTE',
    )
    if (engaged) {
      this.timers ??= newTimers(engaged.ordre, this.clock)
      return
    }

    const nearest = this.nearestSelectable()
    const current = this.stops.find((s) => s.status === 'EN_ROUTE')

    if (!nearest) {
      if (current) current.status = 'EN_ATTENTE'
      this.timers = null
      return
    }

    if (current && current.ordre === nearest.ordre) return

    if (current) current.status = 'EN_ATTENTE'
    nearest.status = 'EN_ROUTE'
    this.timers = newTimers(nearest.ordre, this.clock)
  }

  private completeActive(): void {
    const active = this.activeStop()
    if (!active || !this.timers) return
    this.log.push({
      ordre: active.ordre,
      adresse: active.adresse,
      arrivedAt: this.timers.arrivedAtWall,
      departedAt: Date.now(),
      travelMs: this.travelMsSoFar(),
      interventionMs: this.interventionMsSoFar(),
      outcome: 'TERMINE',
    })
    active.status = 'TERMINE'
    active.completedAt = Date.now()
    this.timers = null
  }

  // --- Aides ----------------------------------------------------------------

  private activeStop(): Stop | null {
    if (!this.timers) return null
    return this.stops.find((s) => s.ordre === this.timers!.ordre) ?? null
  }

  private nearestSelectable(): Stop | null {
    let best: Stop | null = null
    for (const s of this.stops) {
      if (FINAL.has(s.status)) continue
      const d = s.distanceMeters ?? Number.POSITIVE_INFINITY
      const bestD = best?.distanceMeters ?? Number.POSITIVE_INFINITY
      if (best === null || d < bestD) best = s
    }
    return best
  }

  private travelMsSoFar(): number {
    if (!this.timers) return 0
    const end = this.timers.arrivedClock ?? this.clock
    return Math.max(0, end - this.timers.travelStartClock)
  }

  private interventionMsSoFar(): number {
    if (!this.timers || this.timers.interventionStartClock === null) return 0
    const end = this.timers.departStartClock ?? this.clock
    return Math.max(0, end - this.timers.interventionStartClock)
  }

  private recomputeDistances(): void {
    if (!this.position) return
    const pos = this.position
    for (const stop of this.stops) {
      if (stop.status === 'TERMINE') continue
      stop.distanceMeters = haversineMeters(pos, stop)
      stop.etaMinutes = estimateEtaMinutes(stop.distanceMeters)
    }
  }

  private resetRuntime(): void {
    this.position = null
    this.clock = 0
    this.lastTickMs = null
    this.timers = null
    this.log = []
  }

  // --- Snapshot -------------------------------------------------------------

  private emit(): void {
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener()
  }

  private buildSnapshot(): MissionSnapshot {
    const active = this.activeStop()
    const completedCount = this.stops.filter((s) => s.status === 'TERMINE').length

    const otherStops = this.stops
      .filter((s) => s.status !== 'TERMINE' && s.ordre !== active?.ordre)
      .map((s) => ({ ...s }))
      .sort((a, b) => {
        const da = a.distanceMeters ?? Number.POSITIVE_INFINITY
        const db = b.distanceMeters ?? Number.POSITIVE_INFINITY
        if (da !== db) return da - db
        return a.ordre - b.ordre
      })

    const activeMission: ActiveMissionView | null = active
      ? {
          stop: { ...active },
          nextStatus: NEXT_STATUS[active.status] ?? null,
          attention: attentionNotesFor(active.ordre),
        }
      : null

    return {
      phase: this.phase,
      activeMission,
      otherStops,
      counter: this.buildCounter(active),
      log: [...this.log],
      completedCount,
      totalCount: this.stops.length,
      position: this.position,
    }
  }

  private buildCounter(active: Stop | null): CounterView {
    if (!active || !this.timers) {
      return { status: 'EN_ATTENTE', elapsedMs: 0, targetMs: null }
    }
    const t = this.timers
    switch (active.status) {
      case 'EN_ROUTE': {
        const eta = active.etaMinutes
        const targetMs = eta !== null && Number.isFinite(eta) ? eta * 60_000 : null
        return { status: 'EN_ROUTE', elapsedMs: this.clock - t.travelStartClock, targetMs }
      }
      case 'EN_APPROCHE':
        return {
          status: 'EN_APPROCHE',
          elapsedMs: this.clock - (t.approachStartClock ?? this.clock),
          targetMs: APPROACH_DELAY_MS,
        }
      case 'EN_COURS':
        return {
          status: 'EN_COURS',
          elapsedMs: this.clock - (t.interventionStartClock ?? this.clock),
          targetMs: null,
        }
      case 'DEPART':
        return {
          status: 'DEPART',
          elapsedMs: this.clock - (t.departStartClock ?? this.clock),
          targetMs: DEPART_DELAY_MS,
        }
      default:
        return { status: active.status, elapsedMs: 0, targetMs: null }
    }
  }
}

// --- Fonctions utilitaires (module) ----------------------------------------

function resetStop(stop: Stop): Stop {
  return {
    ...stop,
    status: 'EN_ATTENTE',
    distanceMeters: null,
    etaMinutes: null,
    completedAt: null,
    problemCode: null,
  }
}

function newTimers(ordre: number, clock: number): ActiveTimers {
  return {
    ordre,
    travelStartClock: clock,
    arrivedClock: null,
    approachStartClock: null,
    interventionStartClock: null,
    departStartClock: null,
    arrivedAtWall: null,
  }
}
