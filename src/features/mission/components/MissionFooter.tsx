import { Clock, Flag, Navigation } from 'lucide-react'
import { formatDistance, formatElapsed, formatEta } from '../domain/format'
import type { Stop } from '../domain/types'

type MissionFooterProps = {
  nextStop: Stop | null
  completedCount: number
  totalCount: number
  elapsedMs: number
}

export function MissionFooter({
  nextStop,
  completedCount,
  totalCount,
  elapsedMs,
}: MissionFooterProps) {
  return (
    <div className="grid grid-cols-3 gap-2 border-t border-border-subtle bg-surface-card px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <FooterBlock icon={Navigation} label="Prochaine">
        {nextStop ? (
          <>
            <p className="truncate text-body font-semibold text-text">{nextStop.adresse}</p>
            <p className="text-label tabular-nums text-text-muted">
              {formatEta(nextStop.etaMinutes)} · {formatDistance(nextStop.distanceMeters)}
            </p>
          </>
        ) : (
          <p className="text-body font-semibold text-text-muted">—</p>
        )}
      </FooterBlock>

      <FooterBlock icon={Flag} label="Mission">
        <p className="text-body font-semibold tabular-nums text-text">
          {completedCount}/{totalCount}
        </p>
        <p className="text-label text-text-muted">propriétés</p>
      </FooterBlock>

      <FooterBlock icon={Clock} label="Temps total">
        <p className="text-body font-semibold tabular-nums text-text">{formatElapsed(elapsedMs)}</p>
        <p className="text-label text-text-muted">aujourd'hui</p>
      </FooterBlock>
    </div>
  )
}

type FooterBlockProps = {
  icon: typeof Navigation
  label: string
  children: React.ReactNode
}

function FooterBlock({ icon: Icon, label, children }: FooterBlockProps) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        {children}
      </div>
    </div>
  )
}
