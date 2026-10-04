import { cn } from '../../lib/utils'
import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border transition-all duration-200',
          {
            'bg-white dark:bg-navy-800 border-lavender-200 dark:border-navy-700':
              variant === 'default',
            'bg-white dark:bg-navy-800 border-lavender-200 dark:border-navy-700 shadow-lg shadow-navy-500/10':
              variant === 'elevated',
            'glass-card': variant === 'glass',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
