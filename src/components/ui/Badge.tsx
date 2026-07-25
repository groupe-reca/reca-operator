import type { ReactNode } from 'react'

export type BadgeColor = 'gray' | 'red' | 'green' | 'orange' | 'blue'

const COLOR_CLASSES: Record<BadgeColor, string> = {
  gray: 'bg-surface-card-elevated text-text-muted',
  red: 'bg-reca-red/15 text-reca-red',
  green: 'bg-status-success/15 text-status-success',
  orange: 'bg-status-warning/15 text-status-warning',
  blue: 'bg-accent-bg text-accent-strong',
}

type BadgeProps = {
  color?: BadgeColor
  children: ReactNode
}

export function Badge({ color = 'gray', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-label font-medium ${COLOR_CLASSES[color]}`}
    >
      {children}
    </span>
  )
}
