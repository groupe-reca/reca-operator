import { DEFAULT_ENGINE_CONFIG } from '../domain/config'
import type { EngineConfig } from '../domain/config'
import { estimateEtaMinutes, haversineMeters, metersPerSecondToKmh, residenceSide } from '../domain/geo'
import { splitAddress } from '../domain/format'
import type { GpsPosition, Mission, MissionPhase, Stop } from '../domain/types'
import type { MissionStatus } from '../domain/status'
import type { MissionLogEntry } from '../domain/log'
import type { ProblemCode } from '../domain/problemCodes'

/**
 * MissionEngine — **service autonome, sans React**, cœur de l'application.
 *
 * Responsable de TOUTE la logique : réception de la position GPS, calcul des
 * distances, sélection/tri des stops **selon l'ordre de la mission**, machine à
 * états automatique, compteurs / chronomètres et journal des temps. Les distances
 * GPS servent la machine à états (détection d'arrivée), pas l'ordonnancement.
 * L'interface ne fait que pousser les entrées
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
  /** Paramètres réglables courants du moteur (copie vivante, cf. `setConfig`). */
  config: EngineConfig
}

export type ActiveMissionView = {
  stop: Stop
  /** Prochain état attendu de la machine (null si état final). */
  nextStatus: MissionStatus | null
  /** Consignes ATTENTION (message opérateur du contrat, [] si aucun). */
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
  /** Le côté gauche/droite a-t-il déjà été émis pour cet engagement ? */
  sideEmitted: boolean
}

type Listener = () => void

/**
 * Événements de domaine émis par le moteur — **génériques**, sans sémantique voix
 * ni « déneigement ». Consommés (hors moteur) par la couche voix. Le moteur ne
 * décide jamais de parler : il constate et signale.
 */
export type MissionEvent =
  | { type: 'MISSION_STARTED' }
  | { type: 'ACTIVE_MISSION_CHANGED'; ordre: number; address: string }
  | { type: 'APPROACH_ENTERED'; ordre: number; note: string }
  | { type: 'RESIDENCE_SIDE'; ordre: number; side: 'left' | 'right' }
  /**
   * Un stop vient d'atteindre un état terminal — signal **neutre** de persistance
   * (le moteur ne connaît pas Supabase). Consommé hors moteur par le pont de synchro.
   */
  | { type: 'STOP_FINALIZED'; missionItemId: string; outcome: 'TERMINE' | 'NON_TERMINE' }
  | { type: 'MISSION_COMPLETED' }

type EventListener = (event: MissionEvent) => void

const EMPTY_SNAPSHOT: MissionSnapshot = {
  phase: 'IDLE',
  activeMission: null,
  otherStops: [],
  counter: { status: 'EN_ATTENTE', elapsedMs: 0, targetMs: null },
  log: [],
  completedCount: 0,
  totalCount: 0,
  position: null,
  config: DEFAULT_ENGINE_CONFIG,
}

export class MissionEngine {
  private phase: MissionPhase = 'IDLE'
  private stops: Stop[] = []
  private position: GpsPosition | null = null
  private log: MissionLogEntry[] = []

  /** Copie vivante des paramètres réglables (modifiable via `setConfig`). */
  private config: EngineConfig = { ...DEFAULT_ENGINE_CONFIG }

  private clock = 0
  private lastTickMs: number | null = null
  private timers: ActiveTimers | null = null

  private listeners = new Set<Listener>()
  private eventListeners = new Set<EventListener>()
  private snapshot: MissionSnapshot = EMPTY_SNAPSHOT

  /** Garde : la fin de mission n'est signalée qu'une seule fois. */
  private completedEmitted = false

  // --- Abonnement (useSyncExternalStore) -----------------------------------

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): MissionSnapshot => this.snapshot

  // --- Bus d'événements de domaine (consommé par la couche voix) -----------

  onEvent = (listener: EventListener): (() => void) => {
    this.eventListeners.add(listener)
    return () => {
      this.eventListeners.delete(listener)
    }
  }

  private emitEvent(event: MissionEvent): void {
    for (const listener of this.eventListeners) listener(event)
  }

  // --- Paramètres réglables (runtime) --------------------------------------

  getConfig = (): EngineConfig => this.config

  /**
   * Met à jour un ou plusieurs paramètres réglables en direct. Si une mission est
   * en cours, la machine à états est ré-évaluée immédiatement avec les nouveaux
   * seuils (un rayon élargi peut, par exemple, faire passer un stop EN_APPROCHE).
   */
  setConfig(patch: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...patch }
    if (this.phase === 'RUNNING') this.evaluate()
    this.emit()
  }

  // --- Commandes -----------------------------------------------------------

  loadMission(mission: Mission): void {
    // Reprise : on **conserve** les statuts terminaux déjà enregistrés dans Supabase
    // (une résidence déjà faite ne se refait pas) ; les non-terminaux repartent à neuf.
    this.stops = mission.stops.map(rehydrateStop)
    this.resetRuntime()
    this.emit()
  }

  play(): void {
    const freshStart = this.phase === 'IDLE' || this.phase === 'STOPPED'
    if (freshStart) {
      // Démarrage/reprise : préserve les statuts terminaux persistés (cf. loadMission).
      this.stops = this.stops.map(rehydrateStop)
      this.clock = 0
      this.timers = null
      this.log = []
      this.completedEmitted = false
    }
    this.lastTickMs = null
    this.phase = 'RUNNING'
    if (freshStart) this.emitEvent({ type: 'MISSION_STARTED' })
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
    this.emitFinalized(active, 'NON_TERMINE')
    this.checkCompletion()
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
        if (distance <= this.config.arrivalRadiusMeters) {
          active.status = 'EN_APPROCHE'
          timers.arrivedClock = this.clock
          timers.arrivedAtWall = Date.now()
          timers.approachStartClock = this.clock
          this.emitEvent({
            type: 'APPROACH_ENTERED',
            ordre: active.ordre,
            note: active.operatorMessage ?? '',
          })
        }
        break

      case 'EN_APPROCHE':
        if (distance > this.config.arrivalRadiusMeters) {
          // Ressorti du rayon avant la fin du rebours : on repart EN_ROUTE.
          active.status = 'EN_ROUTE'
          timers.arrivedClock = null
          timers.arrivedAtWall = null
          timers.approachStartClock = null
        } else if (this.clock - (timers.approachStartClock ?? this.clock) >= this.config.approachDelayMs) {
          active.status = 'EN_COURS'
          timers.interventionStartClock = this.clock
        }
        break

      case 'EN_COURS':
        if (distance > this.config.arrivalRadiusMeters && speedKmh > this.config.departSpeedKmh) {
          active.status = 'DEPART'
          timers.departStartClock = this.clock
        }
        break

      case 'DEPART':
        if (distance <= this.config.arrivalRadiusMeters) {
          // Revenu sur place : l'intervention reprend.
          active.status = 'EN_COURS'
          timers.departStartClock = null
        } else if (this.clock - (timers.departStartClock ?? this.clock) >= this.config.departDelayMs) {
          this.completeActive()
        }
        break

      default:
        break
    }

    this.detectResidenceSide(active, timers)
  }

  /**
   * Détecte une seule fois le côté gauche/droite du stop actif, quand le calcul
   * est fiable (cap connu, en mouvement, assez proche, angle non ambigu).
   */
  private detectResidenceSide(active: Stop, timers: ActiveTimers): void {
    if (timers.sideEmitted || !this.position) return
    if (active.status !== 'EN_ROUTE' && active.status !== 'EN_APPROCHE') return
    const distance = active.distanceMeters
    if (distance === null) return

    const side = residenceSide(this.position, active, distance)
    if (!side) return

    timers.sideEmitted = true
    this.emitEvent({ type: 'RESIDENCE_SIDE', ordre: active.ordre, side })
  }

  /**
   * Choisit / met à jour la mission active. Tant qu'aucun stop n'est engagé
   * au-delà de EN_ROUTE, le **prochain stop dans l'ordre de la mission** (non
   * final) devient la cible — l'app suit la séquence de la tournée, pas la
   * proximité GPS.
   */
  private selectActiveStop(): void {
    const engaged = this.stops.find(
      (s) => ENGAGED.has(s.status) && s.status !== 'EN_ROUTE',
    )
    if (engaged) {
      this.timers ??= newTimers(engaged.ordre, this.clock)
      return
    }

    const next = this.nextSelectableInOrder()
    const current = this.stops.find((s) => s.status === 'EN_ROUTE')

    if (!next) {
      if (current) current.status = 'EN_ATTENTE'
      this.timers = null
      return
    }

    if (current && current.ordre === next.ordre) return

    if (current) current.status = 'EN_ATTENTE'
    next.status = 'EN_ROUTE'
    this.timers = newTimers(next.ordre, this.clock)
    this.emitEvent({
      type: 'ACTIVE_MISSION_CHANGED',
      ordre: next.ordre,
      address: splitAddress(next.adresse).street,
    })
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
    this.emitFinalized(active, 'TERMINE')
    this.checkCompletion()
  }

  /** Signale la persistance d'un état terminal (neutre : pas de vocabulaire Supabase). */
  private emitFinalized(stop: Stop, outcome: 'TERMINE' | 'NON_TERMINE'): void {
    if (!stop.missionItemId) return
    this.emitEvent({ type: 'STOP_FINALIZED', missionItemId: stop.missionItemId, outcome })
  }

  /** Signale une seule fois la fin de mission quand tous les stops sont finaux. */
  private checkCompletion(): void {
    if (this.completedEmitted || this.stops.length === 0) return
    if (this.stops.every((s) => FINAL.has(s.status))) {
      this.completedEmitted = true
      this.emitEvent({ type: 'MISSION_COMPLETED' })
    }
  }

  // --- Aides ----------------------------------------------------------------

  private activeStop(): Stop | null {
    if (!this.timers) return null
    return this.stops.find((s) => s.ordre === this.timers!.ordre) ?? null
  }

  /** Prochain stop non final dans l'ordre de la mission (plus petit `ordre`). */
  private nextSelectableInOrder(): Stop | null {
    let best: Stop | null = null
    for (const s of this.stops) {
      if (FINAL.has(s.status)) continue
      if (best === null || s.ordre < best.ordre) best = s
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
    this.completedEmitted = false
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
      // Suit l'ordre de la mission (séquence de la tournée), pas la distance GPS.
      .sort((a, b) => a.ordre - b.ordre)

    const activeMission: ActiveMissionView | null = active
      ? {
          stop: { ...active },
          nextStatus: NEXT_STATUS[active.status] ?? null,
          attention: active.operatorMessage ? [active.operatorMessage] : [],
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
      config: this.config,
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
          targetMs: this.config.approachDelayMs,
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
          targetMs: this.config.departDelayMs,
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

/**
 * Réhydrate un stop chargé depuis Supabase : conserve un statut **terminal** déjà
 * enregistré (TERMINE / NON_TERMINE, avec son code problème), et ne réinitialise que
 * les champs runtime. Tout statut non terminal repart `EN_ATTENTE` (repiloté par le GPS).
 */
function rehydrateStop(stop: Stop): Stop {
  if (FINAL.has(stop.status)) {
    return { ...stop, distanceMeters: null, etaMinutes: null }
  }
  return resetStop(stop)
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
    sideEmitted: false,
  }
}
