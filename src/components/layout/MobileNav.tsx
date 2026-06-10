'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, Truck, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNav = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/abonnes', label: 'Abonnés', icon: Users },
  { href: '/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/engins', label: 'Engins', icon: Truck },
  { href: '/parametres', label: 'Plus', icon: MoreHorizontal },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 h-14 flex items-stretch">
      {mobileNav.map(item => {
        const Icon = item.icon
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              active ? 'text-brand-700' : 'text-gray-400',
            )}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
