import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-brand-700 hover:bg-brand-800 text-white border-transparent shadow-sm active:bg-brand-900',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm active:bg-gray-100',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm active:bg-red-800',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent active:bg-gray-200',
  outline: 'bg-white hover:bg-brand-50 text-brand-700 border-brand-600 shadow-sm active:bg-brand-100',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs h-7 rounded',
  md: 'px-3.5 py-2 text-sm h-9 rounded-md',
  lg: 'px-5 py-2.5 text-base h-11 rounded-md',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, fullWidth, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium border transition-colors duration-100 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
