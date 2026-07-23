import { useEffect, useState } from 'react'
import type { MissionEvent } from '../engine/MissionEngine'
import { outcomeToStatut } from '../services/missionMapping'
import { persistItemStatus } from '../services/missionSync'

/**
 * Pont React (glue) entre le `MissionEngine` et la synchronisation Supabase. Vit
 * côté feature car il connaît le moteur ; il garde le service `missionSync`
 * générique. Rôle strictement limité au **routage** : il relaie chaque événement
 * terminal du moteur vers l'écriture des statuts, et expose l'état de connexion
 * pour la bannière « Connexion perdue ». Aucune décision métier ici.
 *
 * Architecture prête pour un futur mode hors-ligne : toutes les écritures passent
 * par le point unique `persistItemStatus` (emplacement d'une future file d'attente).
 */
type UseMissionSyncArgs = {
  subscribeEvents: (listener: (event: MissionEvent) => void) => () => void
}

export function useMissionSync({ subscribeEvents }: UseMissionSyncArgs) {
  const [connectionLost, setConnectionLost] = useState(false)

  useEffect(() => {
    return subscribeEvents((event) => {
      if (event.type !== 'STOP_FINALIZED') return
      void persistItemStatus(event.missionItemId, outcomeToStatut(event.outcome)).then((ok) =>
        setConnectionLost(!ok),
      )
    })
  }, [subscribeEvents])

  return { connectionLost }
}
