import { ChevronDown } from 'lucide-react'
import type { SecondarySort } from '../hooks/useMissionEngine'

type StopListHeaderProps = {
  sort: SecondarySort
  onToggleSort: () => void
}

const SORT_LABEL: Record<SecondarySort, string> = {
  ordre: 'Ordre de mission',
  distance: 'Distance',
}

export function StopListHeader({ sort, onToggleSort }: StopListHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-label font-semibold uppercase tracking-wide text-text-muted">
        Prochaines propriétés
      </h2>
      <button
        type="button"
        onClick={onToggleSort}
        className="flex items-center gap-1 rounded-control px-2 py-1 text-label font-medium text-text-muted transition-colors duration-150 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {SORT_LABEL[sort]}
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
