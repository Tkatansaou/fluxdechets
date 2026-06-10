'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord DSP',
  '/abonnes': 'Abonnés',
  '/paiements': 'Paiements & Recouvrement',
  '/tournees': 'Tournées',
  '/tournees/terrain': 'Saisie terrain',
  '/engins': 'Gestion des engins',
  '/rapports': 'Rapports DSP',
  '/consommables': 'Consommables',
  '/parametres': 'Paramètres',
}

export function TopBar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const title = Object.entries(PAGE_TITLES)
    .find(([key]) => pathname === key || (key !== '/dashboard' && pathname.startsWith(key)))?.[1]
    ?? 'WasteFlow'

  const today = new Date().toLocaleDateString('fr-TG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-10 topbar">
      <h1 className="text-sm font-semibold text-gray-900 flex-1 truncate">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 hidden lg:block">{todayStr}</span>
        {user && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            {user.commune.replace('Commune de ', '')}
          </div>
        )}
      </div>
    </header>
  )
}
