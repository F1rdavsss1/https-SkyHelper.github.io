import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1f]',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-lavender-600 text-white hover:bg-lavender-500 active:scale-95 shadow-md shadow-lavender-900/40':
              variant === 'primary',
            'bg-lavender-600/20 text-lavender-200 hover:bg-lavender-600/35 border border-lavender-500/40 active:scale-95':
              variant === 'secondary',
            'bg-transparent text-lavender-300 hover:bg-lavender-600/15 active:scale-95':
              variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-500 active:scale-95':
              variant === 'danger',
            'h-9 px-4 text-sm': size === 'sm',
            'h-11 px-6 text-base': size === 'md',
            'h-14 px-8 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
