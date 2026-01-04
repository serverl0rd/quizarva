import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-light-hover dark:hover:bg-primary-dark-hover active:bg-primary-light-active dark:active:bg-primary-dark-active': variant === 'primary',
            'bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark hover:border-primary-light dark:hover:border-primary-dark': variant === 'secondary',
            'hover:bg-surface-light dark:hover:bg-surface-dark hover:text-text-primary-light dark:hover:text-text-primary-dark text-text-primary-light dark:text-text-primary-dark': variant === 'ghost',
            'bg-error dark:bg-error-dark text-white hover:bg-error/90 dark:hover:bg-error-dark/90': variant === 'danger',
          },
          {
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-4 text-base': size === 'md',
            'h-14 px-8 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }