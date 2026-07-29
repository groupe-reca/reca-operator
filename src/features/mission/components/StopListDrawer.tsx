import { useState } from 'react'
import { motion } from 'motion/react'
import { ChevronUp } from 'lucide-react'
import { StopList } from './StopList'
import type { Stop } from '../domain/types'

type StopListDrawerProps = {
  stops: Stop[]
  completedCount: number
  reportedCount: number
}

/** Nombre de résidences visibles par défaut, tiroir replié. */
const COLLAPSED_VISIBLE = 3
/** Hauteur approximative d'une ligne `StopRow` (px), pour la limite repliée. */
const ROW_HEIGHT_PX = 84

/**
 * Tiroir rétractable des autres résidences (remplace `StopListHeader` +
 * `MissionCountersRow` dans le flux) : replié par défaut (2-3 cartes visibles),
 * dépliable par un tap ou un glissement vers le haut sur la poignée — jamais la
 * moitié de l'écran par défaut (cf. `design3.txt`).
 */
export function StopListDrawer({ stops, completedCount, reportedCount }: StopListDrawerProps) {
  const [expanded, setExpanded] = useState(false)

  if (stops.length === 0) return null

  const visibleStops = expanded ? stops : stops.slice(0, COLLAPSED_VISIBLE)
  const collapsedMaxHeight = Math.min(stops.length, COLLAPSED_VISIBLE) * ROW_HEIGHT_PX

  return (
    <section className="rounded-card border border-white/10 bg-surface-card/80 shadow-lg shadow-black/40 backdrop-blur-md">
      <motion.button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDragEnd={(_, info) => {
          if (info.offset.y < -24) setExpanded(true)
          else if (info.offset.y > 24) setExpanded(false)
        }}
        aria-expanded={expanded}
        className="flex w-full flex-col items-center gap-2 px-4 pt-2.5 pb-2"
      >
        <span className="h-1 w-9 rounded-full bg-text-faint/50" aria-hidden="true" />
        <span className="flex w-full items-center justify-between gap-2">
          <span className="text-label font-semibold uppercase tracking-wide text-text-muted">
            Résidences ({stops.length})
          </span>
          <span className="flex items-center gap-2 text-[11px] font-medium">
            {reportedCount > 0 && <span className="text-status-warning">{reportedCount} à reprendre</span>}
            {completedCount > 0 && <span className="text-status-success">{completedCount} terminées</span>}
            <ChevronUp
              className={`size-4 text-text-muted transition-transform duration-200 ${expanded ? '' : 'rotate-180'}`}
              aria-hidden="true"
            />
          </span>
        </span>
      </motion.button>

      <div
        style={{ maxHeight: expanded ? '42svh' : collapsedMaxHeight }}
        className="overflow-y-auto px-3 pb-3 transition-[max-height] duration-300 ease-out"
      >
        <StopList stops={visibleStops} />
      </div>
    </section>
  )
}
