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
 * donc l'update ne touche aucune ligne — `heure_debut` n'est jamais écrasée.
 * Best-effort comme `persistItemStatus` : ne lève jamais.
 */
export async function startMission(missionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('missions')
      .update({ statut: 'en_cours', heure_debut: new Date().toISOString() } as never)
      .eq('id', missionId)
      .eq('statut', 'planifiee')
    return !error
  } catch {
    return false
  }
}
