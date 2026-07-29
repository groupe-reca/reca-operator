import { Menu, TriangleAlert, Volume2, VolumeX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type MissionFooterProps = {
  canReportProblem: boolean
  onProblem: () => void
  voiceEnabled: boolean
  onToggleVoice: () => void
  onMoreOptions: () => void
}

/**
 * Footer **production** (toujours visible, plus de gating dev) : Problème,
 * bascule rapide de l'assistance vocale, et Plus d'options (réglages complets +
 * contrôle manuel Play/Pause/Stop, cf. `MissionOptionsSheet`).
 */
export function MissionFooter({
  canReportProblem,
  onProblem,
  voiceEnabled,
  onToggleVoice,
  onMoreOptions,
}: MissionFooterProps) {
  const VoiceIcon = voiceEnabled ? Volume2 : VolumeX

  return (
    <footer className="shrink-0 border-t border-border-subtle bg-surface-card px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="flex items-stretch gap-2">
        <FooterButton
          icon={TriangleAlert}
          label="Problème"
          onClick={onProblem}
          disabled={!canReportProblem}
          className="bg-status-danger text-white disabled:opacity-40"
        />
        <FooterButton
          icon={VoiceIcon}
          label="Annonce vocale"
          onClick={onToggleVoice}
          active={voiceEnabled}
          className={
            voiceEnabled
              ? 'border border-accent-border bg-accent-bg text-accent-strong'
              : 'border border-border-subtle bg-surface-card-elevated text-text-muted'
          }
        />
        <FooterButton
          icon={Menu}
          label="Plus d'options"
          onClick={onMoreOptions}
          className="border border-border-subtle bg-surface-card-elevated text-text"
        />
      </div>
    </footer>
  )
}

type FooterButtonProps = {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  className: string
}

function FooterButton({ icon: Icon, label, onClick, disabled = false, active, className }: FooterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-control py-2.5 text-[11px] font-semibold uppercase tracking-wide transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed ${className}`}
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </button>
  )
}
