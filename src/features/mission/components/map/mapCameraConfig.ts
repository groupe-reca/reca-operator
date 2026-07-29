/**
 * Paramètres de caméra de la carte — présentation pure (aucune logique
 * métier), pour la sensation « conduite » (Tesla/Waze/GPS agricole) : caméra
 * inclinée et zoomée, qui suit le GPS en continu.
 */

/** Inclinaison de caméra (degrés), fixe en mode suivi. */
export const FOLLOW_PITCH = 58

/** Niveau de zoom en mode suivi. */
export const FOLLOW_ZOOM = 18.5

/** Durée (ms) de l'animation de suivi à chaque fix GPS. */
export const FOLLOW_EASE_MS = 1000

/** Distance minimale (mètres) entre deux fix pour relancer une animation de
 * suivi — évite un tremblement de caméra quand le GPS bruite à l'arrêt. */
export const FOLLOW_MIN_MOVE_METERS = 2
