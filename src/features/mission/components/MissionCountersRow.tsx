import { CircleCheck, ListTodo, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type MissionCountersRowProps = {
  todoCount: number
  completedCount: number
  reportedCount: number
  totalCount: number
}

/** Ligne de compteurs (à faire / terminées / à reprendre) + barre de progression. */
export function MissionCountersRow({
  todoCount,
  completedCount,
  reportedCount,
  totalCount,
}: MissionCountersRowProps) {
  const progression = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <section className="rounded-card border border-border-subtle bg-surface-card p-3">
      <div className="flex items-stretch justify-between gap-1">
        <CounterCell icon={ListTodo} iconClass="text-accent-strong" value={todoCount} label="À faire" />
        <Divider />
        <CounterCell icon={CircleCheck} iconClass="text-status-success" value={completedCount} label="Terminées" />
        <Divider />
        <CounterCell icon={RefreshCw} iconClass="text-status-warning" value={reportedCount} label="À reprendre" />
        <Divider />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-strong">Progression</p>
          <p className="text-body font-bold tabular-nums text-text">{progression}%</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-card-elevated">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${progression}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Divider() {
  return <div className="w-px shrink-0 bg-border-subtle" aria-hidden="true" />
}

function CounterCell({
  icon: Icon,
  iconClass,
  value,
  label,
}: {
  icon: LucideIcon
  iconClass: string
  value: number
  label: string
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-center">
      <Icon className={`size-4 ${iconClass}`} aria-hidden="true" />
      <p className="text-body font-bold tabular-nums text-text">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
    </div>
  )
}
