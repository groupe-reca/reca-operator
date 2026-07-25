import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: LucideIcon
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon: Icon, error, id, className = '', ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-label font-medium text-text-muted">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`h-11 w-full rounded-control border bg-surface-card-elevated pl-9 pr-3 text-body text-text placeholder:text-text-faint focus:outline-none focus:ring-2 ${
            error
              ? 'border-status-danger/60 focus:ring-status-danger/30'
              : 'border-border-subtle focus:ring-accent/40'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-label text-status-danger">
          {error}
        </p>
      )}
    </div>
  )
})
