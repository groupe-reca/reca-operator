import { MapPin } from 'lucide-react'
import { TransportControls } from './TransportControls'
import { formatAccuracy, formatClock, formatCoords } from '../domain/format'
import type { GpsPosition, MissionPhase } from '../domain/types'

type MissionHeaderProps = {
  position: GpsPosition | null
  now: number
  phase: MissionPhase
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}

export function MissionHeader({
  position,
  now,
  phase,
  onPlay,
  onPause,
  onStop,
}: MissionHeaderProps) {
  return (
    <div className="rounded-card border border-border-subtle bg-surface-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-status-success" aria-hidden="true" />
            <span className="text-label font-semibold uppercase tracking-wide text-text-muted">
              GPS actuel
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-lg font-semibold tabular-nums text-text">
            {formatCoords(position)}
          </p>
          <p className="mt-1 text-label text-text-muted">
            Précision : {formatAccuracy(position)}
            <span className="mx-1.5 text-text-faint">•</span>
            <span className="tabular-nums">{formatClock(now)}</span>
          </p>
        </div>

        <TransportControls phase={phase} onPlay={onPlay} onPause={onPause} onStop={onStop} />
      </div>
    </div>
  )
}
