import { Bug } from 'lucide-react'

type DevPanelTriggerProps = {
  onOpen: () => void
}

/**
 * Déclencheur discret du panneau de développement (Play/Pause/Stop, cf. section
 * « Contrôle manuel » de `MissionOptionsSheet`, gardée par `config.devControls`).
 * Rendu uniquement quand `devControls` est actif : disparaît complètement d'un
 * vrai déploiement terrain (`devControls: false`), ce qui satisfait « aucun
 * bouton technique » de `design3.txt` tout en restant atteignable pendant le
 * développement/les tests — sans lui, rien ne permettait plus d'ouvrir le
 * panneau une fois les boutons Play/Pause/Stop retirés de l'écran principal.
 */
export function DevPanelTrigger({ onOpen }: DevPanelTriggerProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ouvrir le panneau de développement"
      className="absolute left-3 top-[calc(env(safe-area-inset-top)+152px)] z-30 flex size-9 items-center justify-center rounded-full border border-white/10 bg-surface-card/50 text-text-faint shadow-md backdrop-blur-md transition hover:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
    >
      <Bug className="size-4" aria-hidden="true" />
    </button>
  )
}
