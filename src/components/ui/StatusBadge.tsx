import type { FlightStatus } from '../../types'
import { Badge } from './Badge'
import { Plane, Clock, XCircle, CheckCircle2, DoorOpen, Landmark } from 'lucide-react'

interface StatusBadgeProps {
  status: FlightStatus
  delayMinutes?: number
  compact?: boolean
}

export function StatusBadge({ status, delayMinutes, compact }: StatusBadgeProps) {
  const config = {
    on_time: {
      variant: 'success' as const,
      label: 'По расписанию',
      short: 'Вовремя',
      icon: CheckCircle2,
    },
    delayed: {
      variant: 'warning' as const,
      label: delayMinutes ? `Задержка +${delayMinutes} мин` : 'Задержка',
      short: delayMinutes ? `+${delayMinutes}м` : 'Задержка',
      icon: Clock,
    },
    cancelled: {
      variant: 'error' as const,
      label: 'Отменён',
      short: 'Отменён',
      icon: XCircle,
    },
    boarding: {
      variant: 'info' as const,
      label: 'Посадка',
      short: 'Посадка',
      icon: DoorOpen,
    },
    departed: {
      variant: 'neutral' as const,
      label: 'Вылетел',
      short: 'Вылетел',
      icon: Plane,
    },
    arrived: {
      variant: 'success' as const,
      label: 'Прибыл',
      short: 'Прибыл',
      icon: Landmark,
    },
    scheduled: {
      variant: 'neutral' as const,
      label: 'По расписанию',
      short: 'План',
      icon: Clock,
    },
  }

  const { variant, label, short, icon: Icon } = config[status]

  return (
    <Badge variant={variant} className="gap-1 max-w-[9.5rem] sm:max-w-none">
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate">{compact ? short : label}</span>
    </Badge>
  )
}
