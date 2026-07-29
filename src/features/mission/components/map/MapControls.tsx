import { Layers, LocateFixed } from 'lucide-react'

type MapControlsProps = {
  onRecenter: () => void
  onToggleLayer: () => void
  isSatellite: boolean
}

/** Boutons flottants à droite de la carte : recentrer + bascule de style. */
export function MapControls({ onRecenter, onToggleLayer, isSatellite }: MapControlsProps) {
  return (
    <div className="absolute right-3 top-[calc(env(safe-area-inset-top)+108px)] z-30 flex flex-col gap-2">
      <button
        type="button"
        onClick={onRecenter}
        aria-label="Recentrer la carte"
        className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-surface-card/70 text-text shadow-md backdrop-blur-md transition hover:bg-surface-card-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
      >
        <LocateFixed className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onToggleLayer}
        aria-label="Changer le fond de carte"
        aria-pressed={isSatellite}
        className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-surface-card/70 text-text shadow-md backdrop-blur-md transition hover:bg-surface-card-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
      >
        <Layers className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
