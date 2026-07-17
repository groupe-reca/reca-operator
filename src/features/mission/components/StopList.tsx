import { AnimatePresence } from 'motion/react'
import { StopRow } from './StopRow'
import type { MissionPhase, Stop } from '../domain/types'

type StopListProps = {
  stops: Stop[]
  phase: MissionPhase
}

export function StopList({ stops, phase }: StopListProps) {
  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {stops.map((stop) => (
          <StopRow key={stop.ordre} stop={stop} phase={phase} />
        ))}
      </AnimatePresence>
    </ul>
  )
}
