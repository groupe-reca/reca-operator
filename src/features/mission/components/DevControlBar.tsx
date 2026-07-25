import { Pause, Play, Settings, Square, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MissionPhase } from '../domain/types'

type DevControlBarProps = {
  phase: MissionPhase
  canReportProblem: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onProblem: () => void
  onSettings: () => void
}

/**
 * Barre de contrôle **développement** : Play / Pause / Stop / Problème.
 * Visible uniquement quand `DEV_CONTROLS` est actif (voir `domain/config.ts`).
 * En production, elle disparaît : l'app fonctionne alors 100 % automatiquement.
 */
export function DevControlBar({
  phase,
  canReportProblem,
  onPlay,
  onPause,
  onStop,
  onProblem,
  onSettings,
}: DevControlBarProps) {
  return (
    <div className="border-t border-border-subtle bg-surface-card px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wide text-text-faint">
        Barre de contrôle — développement
      </p>
      <div className="flex items-start justify-center gap-4">
        <Control
          icon={Play}
          label="Play"
          colorClass="bg-status-success"
          labelClass="text-status-success"
          active={phase === 'RUNNING'}
          onClick={onPlay}
        />
        <Control
          icon={Pause}
          label="Pause"
          colorClass="bg-status-warning"
          labelClass="text-status-warning"
          active={phase === 'PAUSED'}
          onClick={onPause}
        />
        <Control
          icon={Square}
          label="Stop"
          colorClass="bg-status-danger"
          labelClass="text-status-danger"
          active={phase === 'STOPPED'}
          onClick={onStop}
        />
        <Control
          icon={TriangleAlert}
          label="Problème"
          colorClass="bg-accent"
          labelClass="text-accent-strong"
          active={false}
          disabled={!canReportProblem}
          onClick={onProblem}
        />
        <Control
          icon={Settings}
          label="Réglages"
          colorClass="bg-surface-card-elevated"
          labelClass="text-text-muted"
          active={false}
          onClick={onSettings}
        />
      </div>
    </div>
  )
}

type ControlProps = {
  icon: LucideIcon
  label: string
  colorClass: string
  labelClass: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}

function Control({
  icon: Icon,
  label,
  colorClass,
  labelClass,
  active,
  disabled = false,
  onClick,
}: ControlProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={`flex size-14 items-center justify-center rounded-2xl text-white transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${colorClass} ${
          active ? 'ring-2 ring-white/70' : 'opacity-90 hover:opacity-100'
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Icon className="size-6" aria-hidden="true" />
      </button>
      <span className={`text-[11px] font-semibold uppercase tracking-wide ${labelClass}`}>
        {label}
      </span>
    </div>
  )
}
