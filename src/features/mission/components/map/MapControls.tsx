import { Layers, LocateFixed } from 'lucide-react'

type MapControlsProps = {
  onRecenter: () => void
  onToggleLayer: () => void
  isSatellite: boolean
}

/** Boutons flottants à droite de la carte : recentrer + bascule de style. */
export function MapControls({ onRecenter, onToggleLayer, isSatellite }: MapControlsProps) {
  return (
    <div className="absolute right-3 top-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={onRecenter}
        aria-label="Recentrer la carte"
        className="flex size-9 items-center justify-center rounded-full border border-border-subtle bg-surface-card/90 text-text shadow-md backdrop-blur-sm transition hover:bg-surface-card-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
      >
        <LocateFixed className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onToggleLayer}
        aria-label="Changer le fond de carte"
        aria-pressed={isSatellite}
        className="flex size-9 items-center justify-center rounded-full border border-border-subtle bg-surface-card/90 text-text shadow-md backdrop-blur-sm transition hover:bg-surface-card-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
      >
        <Layers className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
