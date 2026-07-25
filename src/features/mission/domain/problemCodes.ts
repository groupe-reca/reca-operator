import {
  Ban,
  CalendarClock,
  Car,
  MoreHorizontal,
  Snowflake,
  TriangleAlert,
  UserX,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Les 8 codes « problème » sélectionnables quand une résidence ne peut pas être
 * terminée. Le code choisi est enregistré avec le stop (statut NON_TERMINE) et
 * dans le journal, pour analyse ultérieure.
 *
 * Volontairement génériques (pas de sémantique métier lourde) : le code 5
 * « Non déneigé » reste une étiquette libre, l'app n'en tire aucune logique.
 */
export const PROBLEM_CODES = [
  { code: 1, label: 'Accès bloqué', icon: Ban },
  { code: 2, label: 'Client absent', icon: UserX },
  { code: 3, label: 'Voiture', icon: Car },
  { code: 4, label: 'Obstacle', icon: TriangleAlert },
  { code: 5, label: 'Non déneigé', icon: Snowflake },
  { code: 6, label: 'Bris équipement', icon: Wrench },
  { code: 7, label: 'Autre', icon: MoreHorizontal },
  { code: 8, label: 'À planifier', icon: CalendarClock },
] as const satisfies ReadonlyArray<{ code: number; label: string; icon: LucideIcon }>

export type ProblemCode = (typeof PROBLEM_CODES)[number]['code']

/** Libellé lisible d'un code (pour le journal / l'affichage). */
export function problemCodeLabel(code: ProblemCode): string {
  return PROBLEM_CODES.find((c) => c.code === code)?.label ?? 'Problème'
}
