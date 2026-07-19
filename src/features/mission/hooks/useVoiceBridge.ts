import { useEffect } from 'react'
import { voiceService } from '@/core/voice/VoiceService'
import { voiceAnnouncements } from '@/core/voice/VoiceAnnouncementManager'
import type { MissionEvent } from '../engine/MissionEngine'
import type { EngineConfig } from '../domain/config'

/**
 * Pont React (glue) entre le `MissionEngine` et la couche voix. Vit côté feature
 * car il connaît le moteur ; il garde `core/voice` générique.
 *
 * Rôle strictement limité au **routage** : il initialise le TTS, synchronise
 * l'activation + les catégories depuis la config, puis relaie chaque événement du
 * moteur vers le handler correspondant du `VoiceAnnouncementManager`. **Aucune
 * décision ici** (activation / anti-répétition) : tout est centralisé dans le
 * manager. Les composants React ne touchent donc jamais le TTS.
 */
type UseVoiceBridgeArgs = {
  subscribeEvents: (listener: (event: MissionEvent) => void) => () => void
  config: EngineConfig
}

export function useVoiceBridge({ subscribeEvents, config }: UseVoiceBridgeArgs) {
  const { voiceEnabled, voiceStart, voiceNextAddress, voiceSide, voiceAlerts, voiceEnd } = config

  // Initialise le moteur TTS une seule fois.
  useEffect(() => {
    voiceService.initialize()
  }, [])

  // Synchronise le master on/off et les catégories avec les réglages.
  useEffect(() => {
    voiceService.setEnabled(voiceEnabled)
    voiceAnnouncements.setCategories({
      start: voiceStart,
      nextAddress: voiceNextAddress,
      side: voiceSide,
      alerts: voiceAlerts,
      end: voiceEnd,
    })
  }, [voiceEnabled, voiceStart, voiceNextAddress, voiceSide, voiceAlerts, voiceEnd])

  // Abonnement au bus d'événements du moteur → handlers du manager.
  useEffect(() => {
    return subscribeEvents((event) => {
      switch (event.type) {
        case 'MISSION_STARTED':
          voiceAnnouncements.onMissionStarted()
          break
        case 'ACTIVE_MISSION_CHANGED':
          voiceAnnouncements.onActiveMissionChanged(event.ordre, event.address)
          break
        case 'RESIDENCE_SIDE':
          voiceAnnouncements.onResidenceSide(event.ordre, event.side)
          break
        case 'APPROACH_ENTERED':
          voiceAnnouncements.onCriticalAlert(event.ordre, event.note)
          break
        case 'MISSION_COMPLETED':
          voiceAnnouncements.onMissionCompleted()
          break
      }
    })
  }, [subscribeEvents])

  return {
    /** Diagnostic dev : prononce le message de bienvenue. */
    testVoice: () => voiceService.speak('Bienvenue dans RECA Operator.'),
  }
}
