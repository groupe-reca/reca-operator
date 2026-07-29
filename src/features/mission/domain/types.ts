import type { MissionStatus } from './status'
import type { ProblemCode } from './problemCodes'

/** Coordonnée géographique simple. */
export type LatLng = {
  lat: number
  lng: number
}

/** Une position GPS lue en direct. */
export type GpsPosition = LatLng & {
  accuracy: number
  timestamp: number
  /** Vitesse en m/s (`coords.speed`), ou null si l'appareil ne la fournit pas. */
  speed: number | null
  /** Cap en degrés (0–360, sens horaire depuis le nord), ou null si inconnu. */
  heading: number | null
}

/**
 * Un « stop » de la mission — générique (propriété, toit, site...). Aucune
 * notion métier spécifique n'y est encodée : `type` est une simple étiquette
 * libre venue de la source de données.
 */
export type Stop = {
  /** Id du `mission_items` Supabase (clé d'écriture des statuts), null hors ligne. */
  missionItemId: string | null
  ordre: number
  adresse: string
  lat: number
  lng: number
  type: string
  status: MissionStatus
  /** Message opérateur du contrat, affiché en ATTENTION (null si aucun). */
  operatorMessage: string | null
  /** Distance à vol d'oiseau depuis la position courante, en mètres. */
  distanceMeters: number | null
  /** Temps estimé d'arrivée, en minutes. */
  etaMinutes: number | null
  /** Heure de complétion (ms epoch) pour les stops TERMINE. */
  completedAt: number | null
  /** Code problème sélectionné si le stop est NON_TERMINE. */
  problemCode: ProblemCode | null
}

/** Phase globale de la mission, pilotée par les commandes Play / Pause / Stop. */
export type MissionPhase = 'IDLE' | 'RUNNING' | 'PAUSED' | 'STOPPED'

/** Une mission (tournée) chargée depuis une source de données. */
export type Mission = {
  /** Id `missions` Supabase (clé d'écriture du démarrage), null hors ligne. */
  id: string | null
  nom: string
  /** Nom libre de la route/tournée (`routes.nom`), null si aucune route jointe. */
  routeName: string | null
  /** Nom d'affichage de l'opérateur assigné, null si non résolu. */
  operatorName: string | null
  /** Nom de l'équipement/véhicule assigné (`equipments.nom`), null si aucun. */
  equipmentName: string | null
  stops: Stop[]
}
