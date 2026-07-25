import { AnimatePresence } from 'motion/react'
import { StopRow } from './StopRow'
import type { Stop } from '../domain/types'

export function StopList({ stops }: { stops: Stop[] }) {
  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {stops.map((stop) => (
          <StopRow key={stop.ordre} stop={stop} />
        ))}
      </AnimatePresence>
    </ul>
  )
}
