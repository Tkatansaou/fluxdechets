'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, CreditCard, Route, Truck,
  FileText, Package, Settings, LogOut, ScanSearch, HardHat, ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/abonnes', label: 'Abonnés', icon: Users },
  { href: '/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/tournees', label: 'Tournées', icon: Route },
  { href: '/engins', label: 'Engins', icon: Truck },
  { href: '/employes', label: 'Employés', icon: HardHat },
  { href: '/rapports', label: 'Rapports DSP', icon: FileText },
  { href: '/consommables', label: 'Consommables', icon: Package },
  { href: '/scraping', label: 'Prospection', icon: ScanSearch },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
]

// Nav items supplémentaires pour les rôles spécifiques
function getExtraNav(userRole: string | undefined) {
  const items: { href: string; label: string; icon: any }[] = []
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
    <aside className="hidden md:flex flex-col w-[220px] flex-shrink-0 bg-[#0B1F16] h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#1E3A28]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Truck size={14} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">WasteFlow</div>
            {user && (
              <div className="text-[10px] text-[#9DC4A8] leading-tight mt-0.5 truncate max-w-[140px]">
                {user.orgName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm transition-colors duration-100',
                active
                  ? 'bg-[#1A3D28] text-white font-medium'
                  : 'text-[#9DC4A8] hover:text-white hover:bg-[#162E1F]',
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          )
        })}
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
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {(user.name ?? user.email).slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">{user.name ?? user.email}</div>
              <div className="text-[10px] text-[#9DC4A8] truncate">{user.commune}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 py-2 w-full rounded-md text-[#9DC4A8] hover:text-white hover:bg-[#162E1F] text-sm transition-colors"
        >
          <LogOut size={14} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
