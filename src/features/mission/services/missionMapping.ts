import type { Stop } from '../domain/types'
import type { MissionStatus } from '../domain/status'

/**
 * Correspondances **pures** entre le modèle RECA App (`mission_items` + contrat) et
 * le modèle interne du moteur. Isolé de `missionSupabase`/`missionSync` (qui touchent
 * le client Supabase) pour rester testable sans réseau ni environnement Vite.
 */

/** Statuts possibles d'un `mission_items` côté RECA App. */
export type MissionItemStatut = 'en_attente' | 'en_cours' | 'terminee' | 'a_reprendre' | 'impossible'

/** Ligne `mission_items` avec le contrat joint (adresse, GPS, message, client). */
export type MissionItemJoinRow = {
  id: string
  statut: MissionItemStatut
  contract: {
    adresse_geocodee: string | null
    latitude: number | null
    longitude: number | null
    message_operateur: string | null
    client: { prenom: string; nom: string; entreprise: string | null } | null
  } | null
}

/**
 * Traduit un statut persisté (`mission_items.statut`) vers l'état interne du moteur.
 * Seuls les statuts **terminaux** sont conservés à la reprise ; les non-terminaux
 * repartent `EN_ATTENTE` et sont repilotés par le GPS.
 */
export function mapStatutToInternal(statut: MissionItemStatut): MissionStatus {
  switch (statut) {
    case 'terminee':
      return 'TERMINE'
    case 'a_reprendre':
    case 'impossible':
      return 'NON_TERMINE'
    default:
      return 'EN_ATTENTE'
  }
}

/** Issue terminale du moteur → statut `mission_items` de RECA App. */
export function outcomeToStatut(outcome: 'TERMINE' | 'NON_TERMINE'): MissionItemStatut {
  return outcome === 'TERMINE' ? 'terminee' : 'a_reprendre'
}

/** Convertit une ligne jointe en `Stop` interne (fonction pure, testable). */
export function mapItemToStop(row: MissionItemJoinRow, index: number): Stop {
  const contract = row.contract
  return {
    missionItemId: row.id,
    // `ordre` = rang dans la mission (les items arrivent triés par `created_at`).
    // Il pilote la sélection du stop actif et l'ordre de la liste (la tournée suit
    // la séquence de la mission, pas la distance GPS).
    ordre: index + 1,
    adresse: contract?.adresse_geocodee ?? '',
    lat: Number(contract?.latitude),
    lng: Number(contract?.longitude),
    type: '',
    status: mapStatutToInternal(row.statut),
    operatorMessage: contract?.message_operateur ?? null,
    distanceMeters: null,
    etaMinutes: null,
    completedAt: null,
    problemCode: null,
  }
}
