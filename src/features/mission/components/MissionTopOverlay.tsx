import { Volume2, VolumeX } from 'lucide-react'
import logo from '@/assets/logo-sombre.svg'
import { SmartCounter } from './SmartCounter'
import type { CounterView } from '../engine/MissionEngine'

type MissionTopOverlayProps = {
  missionLabel: string | null
  routeName: string | null
  operatorName: string | null
  equipmentName: string | null
  counter: CounterView
  voiceEnabled: boolean
  onToggleVoice: () => void
}

/**
 * Bandeau flottant du haut : bloc Mission/Route/opérateur à gauche, gros
 * compteur intelligent isolé à droite (couleur = état, cf. maquette
 * `design3.png`) + petite bascule vocale à part. Aucun fond plein écran —
 * chaque bloc flotte indépendamment par-dessus la carte (glassmorphism).
 */
export function MissionTopOverlay({
  missionLabel,
  routeName,
  operatorName,
  equipmentName,
  counter,
  voiceEnabled,
  onToggleVoice,
}: MissionTopOverlayProps) {
  const VoiceIcon = voiceEnabled ? Volume2 : VolumeX

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="pointer-events-auto flex min-w-0 max-w-[58%] flex-col items-start gap-1 rounded-card border border-white/10 bg-surface-card/70 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-md">
        <img src={logo} alt="Groupe RECA" className="h-4 w-auto shrink-0 object-contain" />
        {missionLabel && <p className="truncate text-label font-bold text-text">{missionLabel}</p>}
        {routeName && <p className="truncate text-[11px] font-medium text-accent-strong">{routeName}</p>}
        {(operatorName || equipmentName) && (
          <p className="truncate text-[11px] text-text-muted">
            {[operatorName, equipmentName].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <SmartCounter counter={counter} variant="floating" />
        <button
          type="button"
          onClick={onToggleVoice}
          aria-pressed={voiceEnabled}
          aria-label="Bascule de l'assistance vocale"
          className={`flex size-9 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            voiceEnabled
              ? 'border-accent-border bg-accent-bg text-accent-strong'
              : 'border-white/10 bg-surface-card/70 text-text-muted'
          }`}
        >
          <VoiceIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
