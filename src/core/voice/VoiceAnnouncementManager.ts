import { voiceService } from './VoiceService'
import type { VoiceService } from './VoiceService'

/**
 * VoiceAnnouncementManager — **décideur** des annonces vocales.
 *
 * Les composants React ne déclenchent jamais la voix directement : ils émettent
 * des événements, et ce gestionnaire décide s'il faut parler puis délègue à
 * `VoiceService`. C'est le **point de passage obligatoire** de toute annonce.
 *
 *     MissionEngine → VoiceAnnouncementManager → VoiceService → TTS du téléphone
 *
 * Ce découpage permettra d'ajouter de nouveaux événements (et une logique de
 * décision anti-répétition) sans toucher à l'interface.
 *
 * Annonces prévues aux prochaines phases (NON implémentées ici) :
 *   - Résidence à gauche / à droite
 *   - Arrivée détectée
 *   - Intervention commencée / terminée
 *   - Route terminée
 */
export class VoiceAnnouncementManager {
  private readonly voice: VoiceService

  constructor(voice: VoiceService) {
    this.voice = voice
  }

  /** Point d'étranglement unique — futur emplacement de la logique de décision. */
  private say(message: string): void {
    this.voice.speak(message)
  }

  announceMissionStarted(): void {
    this.say('Mission démarrée. Bonne route.')
  }

  announceNextAddress(address: string): void {
    this.say(`Prochaine adresse : ${address}.`)
  }

  announceCriticalAlert(message: string): void {
    this.say(`Attention. ${message}`)
  }

  announceMissionCompleted(): void {
    this.say('Mission terminée. Bon travail.')
  }
}

/** Singleton branché sur le service vocal partagé. */
export const voiceAnnouncements = new VoiceAnnouncementManager(voiceService)
