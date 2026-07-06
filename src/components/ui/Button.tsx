import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-[var(--color-bg-base)]",
          {
            'bg-[var(--color-accent-primary)] text-black hover:bg-[var(--color-accent-primary)]/90': variant === 'primary',
            'bg-white/10 text-white hover:bg-white/20': variant === 'secondary',
            'bg-[var(--color-accent-danger)] text-white hover:bg-[var(--color-accent-danger)]/90': variant === 'danger',
            'bg-transparent hover:bg-white/10 text-white': variant === 'ghost',
            'h-12 px-6': size === 'default',
            'h-10 px-4': size === 'sm',
            'h-14 px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
