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

/**
 * Marqueurs de voix haute qualité (dans le nom, en minuscules). iOS/macOS
 * exposent des voix « Premium » / « Enhanced » (ex. Amélie, Thomas, Aurélie) et
 * les voix Siri, bien plus naturelles que la voix compacte par défaut. Il faut
 * les préférer explicitement — sinon `getVoices()` renvoie souvent la compacte.
 */
const PREMIUM_MARKERS = ['premium', 'enhanced', 'neural']
const SIRI_MARKER = 'siri'
const QUALITY_NAMES = ['amélie', 'amelie', 'thomas', 'aurélie', 'aurelie', 'audrey', 'marie', 'nicolas']

/** Score une voix française : plus c'est haut, plus la voix est « belle ». */
function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase()
  let score = 0
  if (PREMIUM_MARKERS.some((m) => name.includes(m))) score += 100
  if (name.includes(SIRI_MARKER)) score += 60
  if (QUALITY_NAMES.some((n) => name.includes(n))) score += 30
  if (voice.lang.toLowerCase() === VOICE_LANG.toLowerCase()) score += 10 // Québec
  if (voice.localService) score += 5
  return score
}

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
    utterance.pitch = 1
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

  /** Nom de la voix retenue (pour affichage / diagnostic), ou null. */
  getVoiceName(): string | null {
    return this.preferredVoice?.name ?? null
  }

  /**
   * Choisit la **meilleure** voix française disponible : on ne prend pas la
   * première venue (souvent la voix compacte, robotique) mais celle au score le
   * plus élevé (premium/enhanced/Siri, noms de qualité connus, fr-CA en
   * départage). Fallback : une voix fr quelconque, sinon la voix par défaut.
   */
  private pickVoice(): void {
    if (!this.supported) return
    const french = window.speechSynthesis
      .getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith('fr'))
    if (french.length === 0) {
      this.preferredVoice = null
      return
    }
    this.preferredVoice = french.reduce((best, v) =>
      scoreVoice(v) > scoreVoice(best) ? v : best,
    )
  }
}

/** Singleton partagé par toute l'application. */
export const voiceService = new VoiceService()
