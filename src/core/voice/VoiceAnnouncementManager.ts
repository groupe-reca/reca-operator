import { voiceService } from './VoiceService'
import type { VoiceService } from './VoiceService'

/**
 * VoiceAnnouncementManager — **décideur** des annonces vocales et **seul** endroit
 * où la logique d'annonce vit.
 *
 *     MissionEngine → (événements) → VoiceAnnouncementManager → VoiceService → TTS
 *
 * Les composants React ne déclenchent jamais la voix : le moteur émet des
 * événements neutres, un pont les route vers les handlers ci-dessous, et le
 * gestionnaire décide s'il faut parler selon trois critères :
 *   1. la catégorie est-elle activée dans les réglages ?
 *   2. l'annonce a-t-elle déjà été jouée ? (anti-répétition)
 *   3. les conditions sont-elles réunies ? (ex. note non vide)
 *
 * Le master on/off passe par `VoiceService.isEnabled()` (gate de `speak`).
 * Générique : aucune dépendance à `features/`.
 *
 * Annonces prévues aux prochains sprints (NON implémentées) : arrivée détectée,
 * intervention commencée/terminée, résidence ignorée, retour vers un problème.
 */
export type VoiceCategories = {
  start: boolean
  nextAddress: boolean
  side: boolean
  alerts: boolean
  end: boolean
}

const ALL_ON: VoiceCategories = {
  start: true,
  nextAddress: true,
  side: true,
  alerts: true,
  end: true,
}

export class VoiceAnnouncementManager {
  private readonly voice: VoiceService
  private categories: VoiceCategories = { ...ALL_ON }

  // État anti-répétition (réinitialisé à chaque nouvelle mission).
  private missionCompletedDone = false
  private readonly announcedNext = new Set<number>()
  private readonly announcedSide = new Set<number>()
  private readonly announcedAlert = new Set<number>()

  constructor(voice: VoiceService) {
    this.voice = voice
  }

  /** Active/désactive chaque catégorie d'annonce (depuis les réglages). */
  setCategories(categories: VoiceCategories): void {
    this.categories = categories
  }

  /** Réarme l'anti-répétition (nouvelle mission). */
  reset(): void {
    this.missionCompletedDone = false
    this.announcedNext.clear()
    this.announcedSide.clear()
    this.announcedAlert.clear()
  }

  /** Point d'étranglement unique vers le TTS. */
  private say(message: string): void {
    this.voice.speak(message)
  }

  // --- Handlers d'événements (décision centralisée) ------------------------

  onMissionStarted(): void {
    this.reset() // nouvelle mission : on repart d'une ardoise vierge
    if (!this.categories.start) return
    this.say('Mission démarrée. Bonne route.')
  }

  onActiveMissionChanged(ordre: number, address: string): void {
    if (!this.categories.nextAddress || this.announcedNext.has(ordre)) return
    this.announcedNext.add(ordre)
    this.say(`Prochaine adresse : ${address}.`)
  }

  onResidenceSide(ordre: number, side: 'left' | 'right'): void {
    if (!this.categories.side || this.announcedSide.has(ordre)) return
    this.announcedSide.add(ordre)
    this.say(side === 'left' ? 'Résidence à gauche.' : 'Résidence à droite.')
  }

  onCriticalAlert(ordre: number, note: string): void {
    const message = note.trim()
    if (!this.categories.alerts || !message || this.announcedAlert.has(ordre)) return
    this.announcedAlert.add(ordre)
    this.say(`Attention. ${message}`)
  }

  onMissionCompleted(): void {
    if (!this.categories.end || this.missionCompletedDone) return
    this.missionCompletedDone = true
    this.say('Mission terminée. Bon travail.')
  }
}

/** Singleton branché sur le service vocal partagé. */
export const voiceAnnouncements = new VoiceAnnouncementManager(voiceService)
