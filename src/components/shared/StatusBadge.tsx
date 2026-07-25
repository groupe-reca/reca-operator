import { Badge } from '@/components/ui/Badge'
import type { BadgeColor } from '@/components/ui/Badge'

type StatusConfig<TStatus extends string> = Record<TStatus, { label: string; color: BadgeColor }>

type StatusBadgeProps<TStatus extends string> = {
  status: TStatus
  config: StatusConfig<TStatus>
}

export function StatusBadge<TStatus extends string>({ status, config }: StatusBadgeProps<TStatus>) {
  const { label, color } = config[status]
  return <Badge color={color}>{label}</Badge>
}
