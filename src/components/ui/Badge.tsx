import { cn } from '../../lib/utils'
import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shrink-0',
        {
          'bg-green-500/20 text-green-300 border border-green-500/30': variant === 'success',
          'bg-amber-500/20 text-amber-300 border border-amber-500/30': variant === 'warning',
          'bg-red-500/20 text-red-300 border border-red-500/30': variant === 'error',
          'bg-blue-500/20 text-blue-300 border border-blue-500/30': variant === 'info',
          'bg-lavender-600/25 text-lavender-200 border border-lavender-500/35': variant === 'neutral',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
