import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { STATUS_CONFIG, restingIconFor } from '../domain/status'
import type { StatusTone } from '../domain/status'
import { formatDistance, formatEta, formatTimeOfDay } from '../domain/format'
import type { MissionPhase, Stop } from '../domain/types'

type StopRowProps = {
  stop: Stop
  phase: MissionPhase
}

type ToneStyle = {
  pill: string
  icon: string
  label: string
  row: string
}

const TONE_STYLES: Record<StatusTone, ToneStyle> = {
  neutral: {
    pill: 'bg-surface-card-elevated border border-border-subtle',
    icon: 'text-text-muted',
    label: 'text-text-muted',
    row: 'border-border-subtle bg-surface-card',
  },
  accent: {
    pill: 'bg-accent',
    icon: 'text-white',
    label: 'text-accent-strong',
    row: 'border-accent-border bg-accent-bg',
  },
  success: {
    pill: 'bg-status-success',
    icon: 'text-white',
    label: 'text-status-success',
    row: 'border-border-subtle bg-surface-card',
  },
  warning: {
    pill: 'bg-status-warning',
    icon: 'text-white',
    label: 'text-status-warning',
    row: 'border-border-subtle bg-surface-card',
  },
  danger: {
    pill: 'bg-status-danger',
    icon: 'text-white',
    label: 'text-status-danger',
    row: 'border-border-subtle bg-surface-card',
  },
}

/** Rend une icône lucide reçue en prop (évite de « créer un composant » au render). */
function StatusIcon({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  return <Icon className={className} aria-hidden="true" />
}

export function StopRow({ stop, phase }: StopRowProps) {
  const descriptor = STATUS_CONFIG[stop.status]
  const tone = TONE_STYLES[descriptor.tone]
  const isResting = phase === 'IDLE' || phase === 'STOPPED'
  const icon = isResting ? restingIconFor(stop.status) : descriptor.icon

  const primaryRight =
    stop.status === 'TERMINE' && stop.completedAt !== null
      ? formatTimeOfDay(stop.completedAt)
      : formatEta(stop.etaMinutes)

  return (
    <motion.li
      layout
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-center gap-3 rounded-card border p-3 ${tone.row}`}
    >
      <span className="w-6 shrink-0 text-center text-label font-medium tabular-nums text-text-faint">
        {String(stop.ordre).padStart(2, '0')}
      </span>

      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tone.pill}`}
      >
        <StatusIcon icon={icon} className={`size-5 ${tone.icon}`} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold text-text">{stop.adresse}</p>
        <p className={`text-label font-medium uppercase tracking-wide ${tone.label}`}>
          {descriptor.label}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-body font-semibold tabular-nums text-text">{primaryRight}</p>
        <p className="text-label tabular-nums text-text-muted">
          {formatDistance(stop.distanceMeters)}
        </p>
      </div>

      <ChevronRight className="size-5 shrink-0 text-text-faint" aria-hidden="true" />
    </motion.li>
  )
}
