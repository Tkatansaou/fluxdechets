'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, CreditCard, Route, Truck,
  FileText, Package, Settings, LogOut, ScanSearch, HardHat, ShieldAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const navSections = [
  {
    label: 'Pilotage',
    items: [
      { href: '/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
      { href: '/tournees', label: 'Tournées', icon: Route },
      { href: '/rapports', label: 'Rapports DSP', icon: FileText },
    ],
  },
  {
    label: 'Opérations',
    items: [
      { href: '/abonnes', label: 'Abonnés', icon: Users },
      { href: '/paiements', label: 'Recouvrement', icon: CreditCard },
      { href: '/engins', label: 'Flotte & engins', icon: Truck },
      { href: '/consommables', label: 'Stocks', icon: Package },
      { href: '/employes', label: 'Équipe', icon: HardHat },
    ],
  },
  {
    label: 'Développement',
    items: [
      { href: '/scraping', label: 'Prospection', icon: ScanSearch },
      { href: '/parametres', label: 'Paramètres', icon: Settings },
    ],
  },
]

// Nav items supplémentaires pour les rôles spécifiques
function getExtraNav(userRole: string | undefined) {
  const items: { href: string; label: string; icon: LucideIcon }[] = []
  if (userRole === 'SUPERADMIN') {
    items.push({ href: '/superadmin', label: 'Admin plateforme', icon: ShieldAlert })
  }
  if (userRole === 'MAIRIE') {
    items.push({ href: '/commune', label: 'Vue Mairie', icon: ShieldAlert })
  }
  return items
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnexion réussie')
    router.push('/login')
  }

  return (
    <aside className="sidebar hidden md:flex flex-col w-[236px] flex-shrink-0 bg-[#0B1F16] h-screen sticky top-0 border-r border-[#173224]">
      {/* Logo */}
      <div className="px-4 py-[18px] border-b border-[#1E3A28]">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
            <Truck size={16} strokeWidth={2.25} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm leading-none tracking-tight">fluxdechets.com</div>
            {user && (
              <div className="text-[10px] text-[#9DC4A8] leading-tight mt-1 truncate max-w-[160px]">
                {user.orgName}
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto" aria-label="Navigation principale">
        {navSections.map((section, sectionIndex) => (
          <div key={section.label} className={cn(sectionIndex > 0 && 'mt-3')}>
            <div className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#63866D]">
              {section.label}
            </div>
            <div className="space-y-0.5 px-2">
              {section.items.map(item => {
                const Icon = item.icon
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                      active
                        ? 'bg-[#1A3D28] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(134,239,172,0.08)]'
                        : 'text-[#A9C8B1] hover:text-white hover:bg-[#162E1F]',
                    )}
                  >
                    {active && <span className="absolute left-0 w-0.5 h-4 rounded-r bg-brand-400" />}
                    <Icon size={16} strokeWidth={active ? 2.25 : 1.8} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Nav items supplémentaires (superadmin, mairie…) */}
      {getExtraNav(user?.role).map(item => {
        const Icon = item.icon
        return (
          <div key={item.href} className="px-2 pb-1 border-t border-[#1E3A28] pt-2">
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 mx-0 rounded-md text-sm transition-colors',
                pathname === item.href
                  ? 'bg-purple-900 text-purple-200 font-medium'
                  : 'text-purple-400 hover:text-purple-200 hover:bg-purple-900/40',
              )}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          </div>
        )
      })}

      {/* User / Logout */}
      <div className="border-t border-[#1E3A28] p-3">
        {user && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-md bg-[#10281B]">
            <div className="w-8 h-8 rounded-full bg-brand-700 border border-brand-500/40 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-white">
                {(user.name ?? user.email).slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user.name ?? user.email}</div>
              <div className="text-[10px] text-[#9DC4A8] truncate mt-0.5">{user.commune}</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 py-2 w-full rounded-md text-[#9DC4A8] hover:text-white hover:bg-[#162E1F] text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <LogOut size={14} />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  )
}
