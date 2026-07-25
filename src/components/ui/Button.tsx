import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  isLoading?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-reca-red text-white hover:bg-reca-red-dark focus-visible:ring-reca-red/40 disabled:bg-reca-red/60',
  secondary:
    'bg-surface-card-elevated text-text border border-border-subtle hover:bg-surface-card focus-visible:ring-accent/40',
  ghost:
    'bg-transparent text-text-muted hover:bg-surface-card-elevated focus-visible:ring-accent/30',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', isLoading = false, disabled, className = '', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-control px-4 text-body font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})
