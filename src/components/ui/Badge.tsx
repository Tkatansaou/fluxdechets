import { cn } from '@/lib/utils'
import { getStatutAbonneStyle, getStatutEnginStyle, getStatutTourneeStyle } from '@/lib/utils'
import { STATUT_ABONNE_LABELS, STATUT_ENGIN_LABELS, STATUT_TOURNEE_LABELS } from '@/lib/constants'
import type { StatutAbonne, StatutEngin, StatutTournee } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  gray: 'bg-gray-100 text-gray-500 border-gray-200',
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border leading-tight',
      variantStyles[variant],
      className,
    )}>
      {children}
    </span>
  )
}

export function BadgeAbonne({ statut }: { statut: StatutAbonne }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
      getStatutAbonneStyle(statut),
    )}>
      {STATUT_ABONNE_LABELS[statut] ?? statut}
    </span>
  )
}

export function BadgeEngin({ statut }: { statut: StatutEngin }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
      getStatutEnginStyle(statut),
    )}>
      {STATUT_ENGIN_LABELS[statut] ?? statut}
    </span>
  )
}

export function BadgeTournee({ statut }: { statut: StatutTournee }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
      getStatutTourneeStyle(statut),
    )}>
      {STATUT_TOURNEE_LABELS[statut] ?? statut}
    </span>
  )
}
