/**
 * VoiceService — couche d'abstraction **indépendante** au-dessus du moteur
 * Text-To-Speech **natif du téléphone** (Web Speech API `speechSynthesis`, qui
 * délègue au moteur vocal de l'OS). Aucune API externe, aucune IA, aucun coût.
 *
 * RÈGLE : aucune autre partie de l'application ne doit toucher `speechSynthesis`
 * directement — tout passe par ce service (et, pour les annonces, par
 * `VoiceAnnouncementManager`). Générique (aucune sémantique « déneigement »),
 * conçu pour évoluer (débit/voix configurables, futur plugin natif Capacitor).
 */

const VOICE_LANG = 'fr-CA'

export class VoiceService {
  private readonly supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window
  private enabled = true
  private initialized = false
  private preferredVoice: SpeechSynthesisVoice | null = null

  /** Charge les voix disponibles et mémorise une voix française si possible. */
  initialize(): void {
    if (!this.supported || this.initialized) return
    this.initialized = true
    this.pickVoice()
    // Les voix se chargent parfois de façon asynchrone.
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => this.pickVoice()
    }
  }

  /** Prononce un message. No-op si non supporté, désactivé, ou message vide. */
  speak(message: string): void {
    if (!this.supported || !this.enabled) return
    const text = message.trim()
    if (!text) return

    // Annonce courte : on coupe l'éventuelle annonce précédente (pas de file).
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = VOICE_LANG
    utterance.rate = 1
    if (this.preferredVoice) utterance.voice = this.preferredVoice
    window.speechSynthesis.speak(utterance)
  }

  /** Interrompt immédiatement toute parole en cours. */
  stop(): void {
    if (this.supported) window.speechSynthesis.cancel()
  }

  /** État d'activation (réglage « Assistance vocale »). */
  isEnabled(): boolean {
    return this.enabled
  }

  /** Active/désactive l'assistance vocale ; coupe la parole si désactivée. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.stop()
  }

  /** Le moteur TTS est-il disponible sur cet appareil ? (util pour l'UI) */
  isSupported(): boolean {
    return this.supported
  }

  private pickVoice(): void {
    if (!this.supported) return
    const voices = window.speechSynthesis.getVoices()
    this.preferredVoice =
      voices.find((v) => v.lang === VOICE_LANG) ??
      voices.find((v) => v.lang.startsWith('fr')) ??
      null
  }
}

/** Singleton partagé par toute l'application. */
export const voiceService = new VoiceService()
