'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardCheck, CreditCard, LayoutDashboard, MoreHorizontal, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNav = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/abonnes', label: 'Abonnés', icon: Users },
  { href: '/tournees/terrain', label: 'Terrain', icon: ClipboardCheck, primary: true },
  { href: '/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/parametres', label: 'Plus', icon: MoreHorizontal },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 z-40 h-[calc(3.75rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] flex items-stretch shadow-[0_-4px_16px_rgba(15,23,42,0.05)]" aria-label="Navigation mobile">
      {mobileNav.map(item => {
        const Icon = item.icon
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500',
              active ? 'text-brand-700' : 'text-gray-400 hover:text-gray-600',
            )}
          >
            {item.primary ? (
              <span className={cn(
                'w-9 h-9 -mt-4 rounded-full flex items-center justify-center border-4 border-white shadow-sm',
                active ? 'bg-brand-700 text-white' : 'bg-[#0B1F16] text-brand-300',
              )}>
                <Icon size={18} strokeWidth={2.25} />
              </span>
            ) : (
              <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
            )}
            <span className={cn(item.primary && '-mt-0.5')}>{item.label}</span>
            {active && !item.primary && <span className="absolute top-0 w-6 h-0.5 rounded-b bg-brand-600" />}
          </Link>
        )
      })}
    </nav>
  )
}
