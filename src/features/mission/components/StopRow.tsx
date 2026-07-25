import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { STATUS_CONFIG } from '../domain/status'
import { problemCodeLabel } from '../domain/problemCodes'
import { formatDistance, formatEta, splitAddress } from '../domain/format'
import { TONE_CLASSES } from './statusTone'
import type { Stop } from '../domain/types'

/** Rend une icône lucide reçue en prop (évite de « créer un composant » au render). */
function StatusIcon({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  return <Icon className={className} aria-hidden="true" />
}

export function StopRow({ stop }: { stop: Stop }) {
  const descriptor = STATUS_CONFIG[stop.status]
  const tone = TONE_CLASSES[descriptor.tone]
  const { street, city } = splitAddress(stop.adresse)

  return (
    <motion.li
      layout
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-center gap-3 rounded-card border p-3 ${tone.rowBorder} ${tone.rowBg}`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tone.pill}`}
      >
        <StatusIcon icon={descriptor.icon} className={`size-5 ${tone.pillIcon}`} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold text-text">{street}</p>
        {city && <p className="truncate text-label text-text-muted">{city}</p>}
        <p className={`text-label font-medium uppercase tracking-wide ${tone.text}`}>
          {descriptor.label}
          {stop.status === 'NON_TERMINE' && stop.problemCode !== null && (
            <span className="ml-1 normal-case text-text-muted">
              · {problemCodeLabel(stop.problemCode)}
            </span>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-body font-semibold tabular-nums text-text">{formatEta(stop.etaMinutes)}</p>
        <p className="text-label tabular-nums text-text-muted">{formatDistance(stop.distanceMeters)}</p>
      </div>

      <ChevronRight className="size-5 shrink-0 text-text-faint" aria-hidden="true" />
    </motion.li>
  )
}
