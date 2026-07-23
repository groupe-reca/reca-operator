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
