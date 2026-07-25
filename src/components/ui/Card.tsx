import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-border-subtle bg-surface-card p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
