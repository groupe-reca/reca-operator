import { Menu, Navigation, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type MapFloatingButtonsProps = {
  navigationHref: string | null
  canReportProblem: boolean
  onProblem: () => void
  onOptions: () => void
}

/**
 * Trois gros boutons ronds flottants sur le bord droit de la carte : Navigation
 * (itinéraire externe vers le stop actif), Problème, Options (réglages +
 * contrôle manuel caché en développement, cf. `MissionOptionsSheet`). Remplace
 * l'ancien `MissionFooter.tsx` (barre du bas supprimée, cf. `design3.txt`).
 */
export function MapFloatingButtons({
  navigationHref,
  canReportProblem,
  onProblem,
  onOptions,
}: MapFloatingButtonsProps) {
  return (
    <div className="absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-3">
      <RoundButton
        icon={Navigation}
        label="Navigation"
        disabled={!navigationHref}
        onClick={() => navigationHref && window.open(navigationHref, '_blank', 'noopener,noreferrer')}
        className="bg-accent text-white disabled:opacity-40"
      />
      <RoundButton
        icon={TriangleAlert}
        label="Problème"
        disabled={!canReportProblem}
        onClick={onProblem}
        className="bg-status-danger text-white disabled:opacity-40"
      />
      <RoundButton
        icon={Menu}
        label="Options"
        onClick={onOptions}
        className="border border-white/10 bg-surface-card/70 text-text backdrop-blur-md"
      />
    </div>
  )
}

type RoundButtonProps = {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  className: string
}

function RoundButton({ icon: Icon, label, onClick, disabled = false, className }: RoundButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex size-14 flex-col items-center justify-center gap-0.5 rounded-full shadow-lg shadow-black/40 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed ${className}`}
    >
      <Icon className="size-5" aria-hidden="true" />
      <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  )
}
