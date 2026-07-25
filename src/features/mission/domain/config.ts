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

/** Assistance vocale (TTS) activée par défaut. Coupée → aucune annonce jouée. */
export const VOICE_ENABLED = true

/**
 * Catégories d'annonces vocales, activables **indépendamment** (défaut : toutes
 * actives). Sans effet si le master `VOICE_ENABLED` est coupé.
 */
export const VOICE_START = true
export const VOICE_NEXT_ADDRESS = true
export const VOICE_SIDE = true
export const VOICE_ALERTS = true
export const VOICE_END = true

/**
 * Seuils de fiabilité de la détection gauche/droite (`residenceSide`).
 * **Réglable en code** — non exposé dans l'UI. Le côté n'est annoncé que si le
 * calcul est clairement fiable ; sinon on garde le silence.
 */
export const SIDE_MAX_DISTANCE_METERS = 80
export const SIDE_MIN_SPEED_KMH = 5
export const SIDE_MIN_ANGLE_DEG = 25
export const SIDE_MAX_ANGLE_DEG = 155

/**
 * Regroupement runtime de **tous** les paramètres réglables du moteur. Le
 * `MissionEngine` en tient une copie vivante, modifiable en direct via
 * `setConfig` (voir la modale de réglages). Les constantes ci-dessus restent la
 * **source des valeurs par défaut** (bouton « Réinitialiser »).
 */
export type EngineConfig = {
  arrivalRadiusMeters: number
  lowSpeedKmh: number
  departSpeedKmh: number
  approachDelayMs: number
  departDelayMs: number
  devControls: boolean
  voiceEnabled: boolean
  voiceStart: boolean
  voiceNextAddress: boolean
  voiceSide: boolean
  voiceAlerts: boolean
  voiceEnd: boolean
}

/** Valeurs par défaut = les constantes ci-dessus, assemblées en objet. */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  arrivalRadiusMeters: ARRIVAL_RADIUS_METERS,
  lowSpeedKmh: LOW_SPEED_KMH,
  departSpeedKmh: DEPART_SPEED_KMH,
  approachDelayMs: APPROACH_DELAY_MS,
  departDelayMs: DEPART_DELAY_MS,
  devControls: DEV_CONTROLS,
  voiceEnabled: VOICE_ENABLED,
  voiceStart: VOICE_START,
  voiceNextAddress: VOICE_NEXT_ADDRESS,
  voiceSide: VOICE_SIDE,
  voiceAlerts: VOICE_ALERTS,
  voiceEnd: VOICE_END,
}
