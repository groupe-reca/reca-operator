import { useEffect, useRef } from 'react'
import { voiceService } from './VoiceService'
import { voiceAnnouncements } from './VoiceAnnouncementManager'

/**
 * Hook **glue** entre l'état de la mission et la couche voix. Ce n'est pas un
 * composant : il relie les signaux du moteur (via le snapshot) au
 * `VoiceAnnouncementManager`. Les composants React n'appellent donc jamais le TTS.
 *
 * Ce sprint (cycle de vie manuel) : annonce le **début** et la **fin** de mission.
 * Volontairement découplé du module mission (reçoit `running`, pas la phase).
 */
type UseVoiceArgs = {
  voiceEnabled: boolean
  running: boolean
  completedCount: number
  totalCount: number
}

export function useVoice({ voiceEnabled, running, completedCount, totalCount }: UseVoiceArgs) {
  // Initialise le moteur TTS une seule fois.
  useEffect(() => {
    voiceService.initialize()
  }, [])

  // Synchronise l'activation avec le réglage « Assistance vocale ».
  useEffect(() => {
    voiceService.setEnabled(voiceEnabled)
  }, [voiceEnabled])

  // Début de mission : transition ≠RUNNING → RUNNING (Play manuel ou auto-start).
  const prevRunning = useRef(running)
  useEffect(() => {
    if (!prevRunning.current && running) voiceAnnouncements.announceMissionStarted()
    prevRunning.current = running
  }, [running])

  // Fin de mission : toutes les résidences traitées (annoncé une seule fois).
  const announcedDone = useRef(false)
  useEffect(() => {
    if (totalCount > 0 && completedCount === totalCount) {
      if (!announcedDone.current) {
        announcedDone.current = true
        voiceAnnouncements.announceMissionCompleted()
      }
    } else {
      announcedDone.current = false
    }
  }, [completedCount, totalCount])

  return {
    /** Diagnostic dev : prononce le message de bienvenue. */
    testVoice: () => voiceService.speak('Bienvenue dans RECA Operator.'),
  }
}
