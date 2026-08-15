'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, CircleUserRound, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord DSP',
  '/abonnes': 'Abonnés',
  '/paiements': 'Paiements & Recouvrement',
  '/tournees': 'Tournées',
  '/tournees/terrain': 'Saisie terrain',
  '/engins': 'Flotte & engins',
  '/employes': 'Équipe terrain',
  '/rapports': 'Rapports DSP',
  '/consommables': 'Stocks & consommables',
  '/scraping': 'Prospection',
  '/parametres': 'Paramètres',
  '/commune': 'Portail commune',
  '/superadmin': 'Administration plateforme',
}

export function TopBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine)
    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  const title = Object.entries(PAGE_TITLES)
    .find(([key]) => pathname === key || (key !== '/dashboard' && pathname.startsWith(key)))?.[1]
    ?? 'fluxdechets.com'

  const today = new Date().toLocaleDateString('fr-TG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <header className="h-14 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center px-4 md:px-5 gap-4 sticky top-0 z-30 topbar">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold text-gray-900 truncate">{title}</h1>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate md:hidden">{user?.orgName}</p>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div
          className={`hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ${
            isOnline ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
          }`}
          title={isOnline ? 'Connexion disponible' : 'Mode hors connexion'}
        >
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </div>
        <span className="text-[11px] text-gray-400 hidden xl:block">{todayStr}</span>
        {user && (
          <div className="hidden lg:flex items-center gap-2 border-l border-gray-200 pl-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span className="text-xs font-medium text-gray-600 max-w-[150px] truncate">
              {user.commune.replace('Commune de ', '')}
            </span>
          </div>
        )}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Bell size={17} />
        </button>
        <Link
          href="/parametres"
          aria-label="Ouvrir mon profil"
          className="md:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <CircleUserRound size={20} />
        </Link>
      </div>
    </header>
  )
}
