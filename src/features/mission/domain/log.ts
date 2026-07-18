import type { ProblemCode } from './problemCodes'

/**
 * Journal interne des interventions — mémoire seule pour ce sprint (aucune
 * persistance). Il capture les **durées réelles** mesurées par le moteur, qui
 * alimenteront plus tard les statistiques et la synchro avec le module Routes.
 */
export type MissionLogEntry = {
  ordre: number
  adresse: string
  /** Arrivée dans le rayon (ms epoch), ou null si jamais atteinte. */
  arrivedAt: number | null
  /** Départ confirmé / clôture (ms epoch). */
  departedAt: number
  /** Durée réelle du déplacement jusqu'à l'arrivée (ms). */
  travelMs: number
  /** Durée réelle de l'intervention sur place (ms). */
  interventionMs: number
  /** Issue de la résidence. */
  outcome: 'TERMINE' | 'NON_TERMINE'
  /** Code problème si l'issue est NON_TERMINE. */
  problemCode?: ProblemCode
}
