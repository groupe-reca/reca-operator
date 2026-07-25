import {
  Check,
  Circle,
  CircleX,
  Hourglass,
  LoaderCircle,
  MapPin,
  Navigation,
  Pause,
  Square,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Statuts de mission normalisés — partagés par toute la plateforme Signa.
 * Volontairement génériques (aucune sémantique métier « déneigement ») afin
 * d'être réutilisés par les futures applications terrain (toiture, paysagement,
 * entretien, inspection, ...).
 *
 * Cycle automatique d'un stop actif (piloté par le GPS dans `MissionEngine`) :
 * EN_ATTENTE → EN_ROUTE → EN_APPROCHE → EN_COURS → DEPART → TERMINE.
 * Depuis n'importe quel état engagé, un problème signalé mène à NON_TERMINE.
 */
export const MISSION_STATUS = [
  'EN_ATTENTE',
  'EN_ROUTE',
  'EN_APPROCHE',
  'EN_COURS',
  'DEPART',
  'TERMINE',
  'NON_TERMINE',
  'PAUSE',
  'ARRET',
] as const

export type MissionStatus = (typeof MISSION_STATUS)[number]

/** Ton visuel abstrait — traduit en classes par la couche UI, jamais ici. */
export type StatusTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export type StatusDescriptor = {
  label: string
  tone: StatusTone
  icon: LucideIcon
}

/**
 * Descripteur d'affichage par statut. `EN_ATTENTE` a deux icônes possibles :
 * l'icône par défaut (sablier) une fois la mission lancée, et une icône de
 * repos (cercle) avant tout démarrage — voir `restingIconFor`.
 */
export const STATUS_CONFIG: Record<MissionStatus, StatusDescriptor> = {
  EN_ATTENTE: { label: 'En attente', tone: 'neutral', icon: Hourglass },
  EN_ROUTE: { label: 'En route', tone: 'success', icon: MapPin },
  EN_APPROCHE: { label: 'En approche', tone: 'warning', icon: Target },
  EN_COURS: { label: 'En cours', tone: 'accent', icon: LoaderCircle },
  DEPART: { label: 'Départ', tone: 'accent', icon: Navigation },
  TERMINE: { label: 'Terminée', tone: 'success', icon: Check },
  NON_TERMINE: { label: 'Non terminé', tone: 'danger', icon: CircleX },
  PAUSE: { label: 'Pause', tone: 'warning', icon: Pause },
  ARRET: { label: 'Arrêt', tone: 'danger', icon: Square },
}

/** Icône au repos (mission non démarrée) : cercle gris plutôt que sablier. */
export function restingIconFor(status: MissionStatus): LucideIcon {
  return status === 'EN_ATTENTE' ? Circle : STATUS_CONFIG[status].icon
}
