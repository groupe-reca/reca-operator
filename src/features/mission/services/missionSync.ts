import { supabase } from '@/lib/supabaseClient'
import type { MissionItemStatut } from './missionMapping'

/**
 * Écriture des changements de statut vers Supabase — **point de passage unique**
 * (futur emplacement d'une file d'attente hors-ligne, hors périmètre ce sprint).
 * Toute persistance de statut passe par ici : la mission `mission_items` officielle
 * est mise à jour immédiatement à chaque changement d'état terminal.
 */

/**
 * Persiste le statut d'un MissionItem. Renvoie `true` si l'écriture a réussi,
 * `false` en cas d'échec (réseau/RLS) — le pont de synchro s'en sert pour piloter
 * l'état « Connexion perdue ». Ne lève jamais : l'app terrain ne doit pas planter.
 */
export async function persistItemStatus(
  missionItemId: string,
  statut: MissionItemStatut,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mission_items')
      .update({ statut } as never)
      .eq('id', missionItemId)
    return !error
  } catch {
    return false
  }
}

/**
 * Démarre officiellement la Mission côté RECA App : statut `en_cours` +
 * `heure_debut`. Appelé sur le tout premier `MISSION_STARTED` du moteur (fresh
 * start, jamais une reprise après pause). Le filtre `.eq('statut', 'planifiee')`
 * rend l'appel idempotent : à chaque rechargement de l'app (reconnexion), le
 * moteur rejoue `MISSION_STARTED` mais la Mission est déjà `en_cours` en base,
 * donc l'update ne touche aucune ligne — `heure_debut` n'est jamais écrasée, et
 * aucune 2e ligne d'historique n'est journalisée (voir `.select('id')` ci-dessous,
 * qui distingue "a réellement démarré" de "déjà démarré").
 * Best-effort comme `persistItemStatus` : ne lève jamais.
 */
export async function startMission(missionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('missions')
      .update({ statut: 'en_cours', heure_debut: new Date().toISOString() } as never)
      .eq('id', missionId)
      .eq('statut', 'planifiee')
      .select('id')
    if (error) return false

    // Ligne réellement mise à jour (donc premier vrai démarrage, pas un rejeu
    // de MISSION_STARTED sur reconnexion) : journalise dans l'historique de la
    // Mission — même table/type que RECA App (`mission_events`, type
    // `mission_debutee`), pour que l'admin voie "Début" avec l'opérateur comme
    // auteur réel (`created_by` posé par le trigger d'audit). Best-effort : un
    // échec de journalisation ne doit jamais faire échouer le démarrage réel.
    if (data && data.length > 0) {
      try {
        await supabase.from('mission_events').insert({ mission_id: missionId, type: 'mission_debutee' } as never)
      } catch {
        // ignoré : l'historique n'est pas critique pour le déroulement de la tournée.
      }
    }

    return true
  } catch {
    return false
  }
}
