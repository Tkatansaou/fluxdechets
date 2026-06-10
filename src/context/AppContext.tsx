'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { mockData } from '@/lib/mock-data'
import { generateId, generateReference, generateToken, calculTauxRecouvrement } from '@/lib/utils'
import type {
  AppState, User, Zone, Abonne, Paiement, Tournee, Marquage,
  Engin, Maintenance, Carburant, Panne, Consommable, MouvementStock,
  Organisation, Alerte, KpiData,
} from '@/types'

interface AppContextType {
  state: AppState
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  alertes: Alerte[]
  kpis: KpiData

  // Abonnés
  addAbonne: (data: Omit<Abonne, 'id' | 'lien_paiement_token' | 'created_at'>) => Abonne
  updateAbonne: (id: string, data: Partial<Abonne>) => void
  deleteAbonne: (id: string) => void
  importAbonnes: (data: Omit<Abonne, 'id' | 'lien_paiement_token' | 'created_at'>[]) => number

  // Paiements
  addPaiement: (data: Omit<Paiement, 'id' | 'reference' | 'created_at'>) => Paiement
  updateAbonneStatutFromPaiements: (abonne_id: string) => void

  // Tournées
  addTournee: (data: Omit<Tournee, 'id' | 'created_at'>) => Tournee
  updateTournee: (id: string, data: Partial<Tournee>) => void

  // Marquages
  addMarquage: (data: Omit<Marquage, 'id' | 'created_at'>) => void
  updateMarquage: (id: string, data: Partial<Marquage>) => void

  // Engins
  addEngin: (data: Omit<Engin, 'id' | 'created_at'>) => Engin
  updateEngin: (id: string, data: Partial<Engin>) => void

  // Maintenances
  addMaintenance: (data: Omit<Maintenance, 'id' | 'created_at'>) => void

  // Carburants
  addCarburant: (data: Omit<Carburant, 'id' | 'created_at'>) => void

  // Pannes
  addPanne: (data: Omit<Panne, 'id' | 'created_at'>) => void
  updatePanne: (id: string, data: Partial<Panne>) => void

  // Consommables
  addConsommable: (data: Omit<Consommable, 'id' | 'created_at'>) => void
  updateConsommable: (id: string, data: Partial<Consommable>) => void
  addMouvementStock: (data: Omit<MouvementStock, 'id' | 'created_at'>) => void

  // Organisation
  updateOrganisation: (data: Partial<Organisation>) => void

  // Zones
  addZone: (data: Omit<Zone, 'id' | 'created_at'>) => Zone
  updateZone: (id: string, data: Partial<Zone>) => void

  // Users
  addUser: (data: Omit<User, 'id' | 'created_at'>) => void
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void

  resetToMockData: () => void
}

const AppContext = createContext<AppContextType | null>(null)

const STORAGE_KEY = 'wf_appdata'
const USER_KEY = 'wf_user'

function loadState(): AppState {
  if (typeof window === 'undefined') return mockData
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return mockData
    return JSON.parse(raw) as AppState
  } catch {
    return mockData
  }
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function computeAlerts(state: AppState): Alerte[] {
  const alerts: Alerte[] = []

  // Pannes ouvertes
  state.pannes.filter(p => p.statut === 'ouverte' || p.statut === 'en-cours').forEach(p => {
    const engin = state.engins.find(e => e.id === p.engin_id)
    alerts.push({
      id: `alert-panne-${p.id}`,
      type: 'panne-engin',
      titre: `Engin en panne : ${engin?.immatriculation ?? 'inconnu'}`,
      description: p.description,
      date: p.date,
      lien: '/engins',
      gravite: 'critique',
    })
  })

  // Tournées annulées récentes
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  state.tournees
    .filter(t => t.statut === 'annulée' && t.date >= weekAgo && t.date <= today)
    .forEach(t => {
      const zone = state.zones.find(z => z.id === t.zone_id)
      alerts.push({
        id: `alert-tournee-${t.id}`,
        type: 'zone-non-couverte',
        titre: `Tournée annulée : ${zone?.nom ?? 'Zone inconnue'}`,
        description: t.notes ?? 'Tournée non effectuée',
        date: t.date,
        lien: '/tournees',
        gravite: 'attention',
      })
    })

  // Stocks bas
  state.consommables
    .filter(c => c.stock_actuel <= c.seuil_alerte)
    .forEach(c => {
      alerts.push({
        id: `alert-stock-${c.id}`,
        type: 'stock-bas',
        titre: `Stock bas : ${c.nom}`,
        description: `${c.stock_actuel} ${c.unite} restant(s) — seuil d'alerte : ${c.seuil_alerte} ${c.unite}`,
        date: new Date().toISOString().split('T')[0],
        lien: '/consommables',
        gravite: 'attention',
      })
    })

  return alerts.sort((a, b) => {
    const order = { critique: 0, attention: 1, info: 2 }
    return order[a.gravite] - order[b.gravite]
  })
}

function computeKpis(state: AppState): KpiData {
  const actifs = state.abonnes.filter(a => a.actif && a.statut !== 'inactif')
  const aJour = actifs.filter(a => a.statut === 'à-jour').length
  const tauxRecouvrement = actifs.length > 0 ? Math.round((aJour / actifs.length) * 100) : 0

  const tournees = state.tournees
  const effectuees = tournees.filter(t => t.statut === 'terminée')
  const planifiees = tournees.filter(t => t.statut !== 'annulée')
  const tauxCollecte = planifiees.length > 0
    ? Math.round((effectuees.length / planifiees.length) * 100)
    : 100

  const enginsOperationnels = state.engins.filter(e => e.statut === 'opérationnel').length

  // Recouvrement par mois (6 derniers mois)
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const moisPaiements = state.paiements.filter(p => p.mois_concerne === moisKey && p.statut === 'validé')
    const abonnesActifsMois = actifs.length
    const taux = abonnesActifsMois > 0 ? Math.round((moisPaiements.length / abonnesActifsMois) * 100) : 0
    const d2 = new Date(d.getFullYear(), d.getMonth(), 1)
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    months.push({ mois: moisLabels[d2.getMonth()], taux: Math.min(taux, 100) })
  }

  return {
    abonnes_actifs: actifs.length,
    objectif_abonnes: state.organisation.objectif_abonnes,
    taux_recouvrement: tauxRecouvrement,
    objectif_recouvrement: state.organisation.objectif_recouvrement,
    taux_collecte: tauxCollecte,
    objectif_collecte: state.organisation.objectif_collecte,
    engins_operationnels: enginsOperationnels,
    engins_total: state.engins.length,
    alertes_count: computeAlerts(state).length,
    recouvrement_par_mois: months,
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(mockData)
  const [currentUser, setCurrentUserState] = useState<User | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = loadState()
    setState(loaded)
    try {
      const raw = localStorage.getItem(USER_KEY)
      if (raw) setCurrentUserState(JSON.parse(raw))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveState(state)
  }, [state, hydrated])

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user)
    if (typeof window !== 'undefined') {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
      else localStorage.removeItem(USER_KEY)
    }
  }, [])

  const mutate = useCallback((fn: (s: AppState) => AppState) => {
    setState(prev => fn(prev))
  }, [])

  // Abonnés
  const addAbonne = useCallback((data: Omit<Abonne, 'id' | 'lien_paiement_token' | 'created_at'>) => {
    const newAbonne: Abonne = {
      ...data,
      id: 'ab-' + generateId(),
      lien_paiement_token: generateToken(),
      created_at: new Date().toISOString(),
    }
    mutate(s => ({ ...s, abonnes: [...s.abonnes, newAbonne] }))
    return newAbonne
  }, [mutate])

  const updateAbonne = useCallback((id: string, data: Partial<Abonne>) => {
    mutate(s => ({
      ...s,
      abonnes: s.abonnes.map(a => a.id === id ? { ...a, ...data } : a),
    }))
  }, [mutate])

  const deleteAbonne = useCallback((id: string) => {
    mutate(s => ({
      ...s,
      abonnes: s.abonnes.map(a => a.id === id ? { ...a, actif: false, statut: 'inactif' } : a),
    }))
  }, [mutate])

  const importAbonnes = useCallback((data: Omit<Abonne, 'id' | 'lien_paiement_token' | 'created_at'>[]) => {
    const news = data.map(d => ({
      ...d,
      id: 'ab-' + generateId(),
      lien_paiement_token: generateToken(),
      created_at: new Date().toISOString(),
    }))
    mutate(s => ({ ...s, abonnes: [...s.abonnes, ...news] }))
    return news.length
  }, [mutate])

  const updateAbonneStatutFromPaiements = useCallback((abonne_id: string) => {
    mutate(s => {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const hasPaid = s.paiements.some(
        p => p.abonne_id === abonne_id && p.mois_concerne === currentMonth && p.statut === 'validé'
      )
      return {
        ...s,
        abonnes: s.abonnes.map(a =>
          a.id === abonne_id ? { ...a, statut: hasPaid ? 'à-jour' : a.statut } : a
        ),
      }
    })
  }, [mutate])

  // Paiements
  const addPaiement = useCallback((data: Omit<Paiement, 'id' | 'reference' | 'created_at'>) => {
    const newP: Paiement = {
      ...data,
      id: 'p-' + generateId(),
      reference: generateReference(),
      created_at: new Date().toISOString(),
    }
    mutate(s => {
      const newAbonnes = s.abonnes.map(a => {
        if (a.id !== newP.abonne_id) return a
        return { ...a, statut: 'à-jour' as const }
      })
      return { ...s, paiements: [...s.paiements, newP], abonnes: newAbonnes }
    })
    return newP
  }, [mutate])

  // Tournées
  const addTournee = useCallback((data: Omit<Tournee, 'id' | 'created_at'>) => {
    const t: Tournee = { ...data, id: 't-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => ({ ...s, tournees: [...s.tournees, t] }))
    return t
  }, [mutate])

  const updateTournee = useCallback((id: string, data: Partial<Tournee>) => {
    mutate(s => ({ ...s, tournees: s.tournees.map(t => t.id === id ? { ...t, ...data } : t) }))
  }, [mutate])

  // Marquages
  const addMarquage = useCallback((data: Omit<Marquage, 'id' | 'created_at'>) => {
    const m: Marquage = { ...data, id: 'm-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => ({ ...s, marquages: [...s.marquages, m] }))
  }, [mutate])

  const updateMarquage = useCallback((id: string, data: Partial<Marquage>) => {
    mutate(s => ({ ...s, marquages: s.marquages.map(m => m.id === id ? { ...m, ...data } : m) }))
  }, [mutate])

  // Engins
  const addEngin = useCallback((data: Omit<Engin, 'id' | 'created_at'>) => {
    const e: Engin = { ...data, id: 'eng-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => ({ ...s, engins: [...s.engins, e] }))
    return e
  }, [mutate])

  const updateEngin = useCallback((id: string, data: Partial<Engin>) => {
    mutate(s => ({ ...s, engins: s.engins.map(e => e.id === id ? { ...e, ...data } : e) }))
  }, [mutate])

  // Maintenances
  const addMaintenance = useCallback((data: Omit<Maintenance, 'id' | 'created_at'>) => {
    const m: Maintenance = { ...data, id: 'mnt-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => ({ ...s, maintenances: [...s.maintenances, m] }))
  }, [mutate])

  // Carburants
  const addCarburant = useCallback((data: Omit<Carburant, 'id' | 'created_at'>) => {
    const c: Carburant = { ...data, id: 'car-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => {
      const engins = s.engins.map(e => e.id === data.engin_id ? { ...e, kilometrage: data.kilometrage } : e)
      return { ...s, carburants: [...s.carburants, c], engins }
    })
  }, [mutate])

  // Pannes
  const addPanne = useCallback((data: Omit<Panne, 'id' | 'created_at'>) => {
    const p: Panne = { ...data, id: 'pan-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => {
      const engins = s.engins.map(e => e.id === data.engin_id ? { ...e, statut: 'en-panne' as const } : e)
      return { ...s, pannes: [...s.pannes, p], engins }
    })
  }, [mutate])

  const updatePanne = useCallback((id: string, data: Partial<Panne>) => {
    mutate(s => {
      const updated = s.pannes.map(p => p.id === id ? { ...p, ...data } : p)
      let engins = s.engins
      if (data.statut === 'résolue') {
        const panne = updated.find(p => p.id === id)
        if (panne) {
          const stillBroken = updated.some(p => p.engin_id === panne.engin_id && (p.statut === 'ouverte' || p.statut === 'en-cours'))
          if (!stillBroken) {
            engins = engins.map(e => e.id === panne.engin_id ? { ...e, statut: 'opérationnel' as const } : e)
          }
        }
      }
      return { ...s, pannes: updated, engins }
    })
  }, [mutate])

  // Consommables
  const addConsommable = useCallback((data: Omit<Consommable, 'id' | 'created_at'>) => {
    const c: Consommable = { ...data, id: 'cons-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => ({ ...s, consommables: [...s.consommables, c] }))
  }, [mutate])

  const updateConsommable = useCallback((id: string, data: Partial<Consommable>) => {
    mutate(s => ({ ...s, consommables: s.consommables.map(c => c.id === id ? { ...c, ...data } : c) }))
  }, [mutate])

  const addMouvementStock = useCallback((data: Omit<MouvementStock, 'id' | 'created_at'>) => {
    const m: MouvementStock = { ...data, id: 'mvt-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => {
      const consommables = s.consommables.map(c => {
        if (c.id !== data.consommable_id) return c
        const delta = data.type === 'entrée' ? data.quantite : -data.quantite
        return { ...c, stock_actuel: Math.max(0, c.stock_actuel + delta) }
      })
      return { ...s, mouvements_stock: [...s.mouvements_stock, m], consommables }
    })
  }, [mutate])

  // Organisation
  const updateOrganisation = useCallback((data: Partial<Organisation>) => {
    mutate(s => ({ ...s, organisation: { ...s.organisation, ...data } }))
  }, [mutate])

  // Zones
  const addZone = useCallback((data: Omit<Zone, 'id' | 'created_at'>) => {
    const z: Zone = { ...data, id: 'zone-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => ({ ...s, zones: [...s.zones, z] }))
    return z
  }, [mutate])

  const updateZone = useCallback((id: string, data: Partial<Zone>) => {
    mutate(s => ({ ...s, zones: s.zones.map(z => z.id === id ? { ...z, ...data } : z) }))
  }, [mutate])

  // Users
  const addUser = useCallback((data: Omit<User, 'id' | 'created_at'>) => {
    const u: User = { ...data, id: 'user-' + generateId(), created_at: new Date().toISOString() }
    mutate(s => ({ ...s, users: [...s.users, u] }))
  }, [mutate])

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    mutate(s => ({ ...s, users: s.users.map(u => u.id === id ? { ...u, ...data } : u) }))
  }, [mutate])

  const deleteUser = useCallback((id: string) => {
    mutate(s => ({ ...s, users: s.users.map(u => u.id === id ? { ...u, actif: false } : u) }))
  }, [mutate])

  const resetToMockData = useCallback(() => {
    setState(mockData)
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  }, [])

  const alertes = computeAlerts(state)
  const kpis = computeKpis(state)

  return (
    <AppContext.Provider value={{
      state, currentUser, setCurrentUser, alertes, kpis,
      addAbonne, updateAbonne, deleteAbonne, importAbonnes, updateAbonneStatutFromPaiements,
      addPaiement,
      addTournee, updateTournee,
      addMarquage, updateMarquage,
      addEngin, updateEngin,
      addMaintenance, addCarburant,
      addPanne, updatePanne,
      addConsommable, updateConsommable, addMouvementStock,
      updateOrganisation,
      addZone, updateZone,
      addUser, updateUser, deleteUser,
      resetToMockData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
