import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MOIS_COURTS, SEUIL_RECOUVREMENT_VERT, SEUIL_RECOUVREMENT_ORANGE } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-TG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA'
}

export function formatDate(dateStr: string, fmt = 'dd/MM/yyyy'): string {
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, fmt, { locale: fr })
  } catch {
    return dateStr
  }
}

export function formatDateLong(dateStr: string): string {
  return formatDate(dateStr, 'd MMMM yyyy')
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, 'dd/MM/yy')
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, "dd/MM/yyyy 'à' HH:mm")
}

export function getMoisAnnee(dateStr: string): string {
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, 'MMMM yyyy', { locale: fr })
  } catch {
    return dateStr
  }
}

export function getMoisCourt(moisStr: string): string {
  const idx = parseInt(moisStr.split('-')[1]) - 1
  return MOIS_COURTS[idx] ?? moisStr
}

export function getRecouvrementColor(taux: number, _objectif = 80): string {
  if (taux >= SEUIL_RECOUVREMENT_VERT) return 'text-emerald-600'
  if (taux >= SEUIL_RECOUVREMENT_ORANGE) return 'text-amber-600'
  return 'text-red-600'
}

export function getRecouvrementBg(taux: number): string {
  if (taux >= SEUIL_RECOUVREMENT_VERT) return 'bg-emerald-50 border-emerald-200'
  if (taux >= SEUIL_RECOUVREMENT_ORANGE) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

export function getStatutAbonneStyle(statut: string): string {
  switch (statut) {
    case 'à-jour': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'en-retard': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'impayé': return 'bg-red-100 text-red-800 border-red-200'
    case 'inactif': return 'bg-gray-100 text-gray-600 border-gray-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export function getStatutEnginStyle(statut: string): string {
  switch (statut) {
    case 'opérationnel': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'en-panne': return 'bg-red-100 text-red-800 border-red-200'
    case 'en-maintenance': return 'bg-amber-100 text-amber-800 border-amber-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export function getStatutTourneeStyle(statut: string): string {
  switch (statut) {
    case 'planifiée': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'en-cours': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'terminée': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'annulée': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export function getTauxCollecteStyle(taux: number): string {
  if (taux >= 99) return 'text-emerald-600'
  if (taux >= 85) return 'text-amber-600'
  return 'text-red-600'
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export function generateReference(): string {
  return 'WF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase()
}

export function generateToken(): string {
  return Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 16)
}

export function calculTauxRecouvrement(abonnes: { statut: string; actif: boolean }[]): number {
  const actifs = abonnes.filter(a => a.actif && a.statut !== 'inactif')
  if (actifs.length === 0) return 0
  const aJour = actifs.filter(a => a.statut === 'à-jour').length
  return Math.round((aJour / actifs.length) * 100)
}

export function formatTelephone(tel: string): string {
  const cleaned = tel.replace(/\D/g, '')
  if (cleaned.startsWith('228') && cleaned.length === 11) {
    return `+228 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`
  }
  return tel
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

export function getPreviousMonths(n: number): string[] {
  const months = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(format(d, 'yyyy-MM'))
  }
  return months
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function nomComplet(user: { nom: string; prenom: string }): string {
  return `${user.prenom} ${user.nom}`
}

export function initiales(user: { nom: string; prenom: string }): string {
  return (user.prenom[0] ?? '') + (user.nom[0] ?? '')
}
