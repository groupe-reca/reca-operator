/**
 * Constantes de réglage du moteur de mission — **toutes réglables**, jamais
 * codées en dur dans la logique. Génériques (aucune sémantique « déneigement »)
 * afin de rester réutilisables par les futures apps terrain Signa.
 *
 * Ces valeurs pilotent la machine à états automatique (`MissionEngine`) : rayon
 * d'arrivée, seuils de vitesse et délais des comptes à rebours.
 */

/** Rayon d'arrivée (mètres). Sous ce seuil, un stop actif passe EN_APPROCHE. */
export const ARRIVAL_RADIUS_METERS = 25

/** Vitesse faible (km/h) confirmant que l'opérateur est arrêté sur place. */
export const LOW_SPEED_KMH = 3

/** Vitesse (km/h) au-delà de laquelle une sortie du rayon confirme le départ. */
export const DEPART_SPEED_KMH = 5

/** Délai (ms) EN_APPROCHE → EN_COURS (compte à rebours « avant intervention »). */
export const APPROACH_DELAY_MS = 30_000

/** Délai (ms) DEPART → TERMINE (compte à rebours « avant terminé »). */
export const DEPART_DELAY_MS = 30_000

/**
 * Mode DÉVELOPPEMENT. `true` : la barre Play / Pause / Stop / Problème est
 * visible et la mission attend un Play manuel. `false` (production) : la barre
 * disparaît et l'app démarre automatiquement — plus aucune action manuelle.
 */
export const DEV_CONTROLS = true
