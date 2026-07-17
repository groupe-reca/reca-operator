import { Pause, Play, Square } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MissionPhase } from '../domain/types'

type TransportControlsProps = {
  phase: MissionPhase
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}

type ControlProps = {
  icon: LucideIcon
  label: string
  colorClass: string
  active: boolean
  onClick: () => void
}

function Control({ icon: Icon, label, colorClass, active, onClick }: ControlProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={`flex size-14 items-center justify-center rounded-2xl text-white transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${colorClass} ${
          active ? 'ring-2 ring-white/70' : 'opacity-90 hover:opacity-100'
        }`}
      >
        <Icon className="size-6" aria-hidden="true" fill="currentColor" strokeWidth={0} />
      </button>
      <span className={`text-[11px] font-semibold uppercase tracking-wide ${label === 'Play' ? 'text-status-success' : label === 'Pause' ? 'text-status-warning' : 'text-status-danger'}`}>
        {label}
      </span>
    </div>
  )
}

export function TransportControls({ phase, onPlay, onPause, onStop }: TransportControlsProps) {
  const isRunning = phase === 'RUNNING'

  return (
    <div className="flex items-start gap-3">
      <Control
        icon={Play}
        label="Play"
        colorClass="bg-status-success"
        active={isRunning}
        onClick={onPlay}
      />
      <Control
        icon={Pause}
        label="Pause"
        colorClass="bg-status-warning"
        active={phase === 'PAUSED'}
        onClick={onPause}
      />
      <Control
        icon={Square}
        label="Stop"
        colorClass="bg-status-danger"
        active={phase === 'STOPPED'}
        onClick={onStop}
      />
    </div>
  )
}
