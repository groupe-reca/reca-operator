import { CalendarDays } from 'lucide-react'

type MissionCardProps = {
  nom: string
  completedCount: number
  totalCount: number
}

export function MissionCard({ nom, completedCount, totalCount }: MissionCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface-card p-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface-card-elevated">
        <CalendarDays className="size-5 text-text-muted" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-label font-semibold uppercase tracking-wide text-text-muted">
          Mission du jour
        </p>
        <p className="truncate text-subtitle font-semibold text-text">{nom}</p>
      </div>
      <div className="shrink-0 rounded-control bg-surface-card-elevated px-3 py-2 text-center">
        <p className="text-lg font-bold tabular-nums leading-none text-text">
          {completedCount} / {totalCount}
        </p>
        <p className="mt-1 text-[11px] text-text-muted">Propriétés visitées</p>
      </div>
    </div>
  )
}
