'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn, formatFCFA, formatDate } from '@/lib/utils'
import { OPERATEUR_MM } from '@/lib/constants'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface Paiement {
  id: string
  abonneId: string
  abonne: { nom: string; prenom: string; zone: { id: string; nom: string } }
  montant: number
  moyen: string
  operateur: string | null
  statut: string
  reference: string
  moisConcerne: string
  date: string
}

interface Abonne {
  id: string
  prenom: string
  nom: string
  telephone: string
  statut: string
  zone: { id: string; nom: string }
}

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [abonnes, setAbonnes] = useState<Abonne[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMois, setFilterMois] = useState<string>('tous')
  const [filterZone, setFilterZone] = useState<string>('toutes')
  const [filterMode, setFilterMode] = useState<string>('tous')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [payData, abData] = await Promise.all([
        api<{ paiements: Paiement[] }>('/api/paiements'),
        api<{ abonnes: Abonne[] }>('/api/abonnes'),
      ])
      setPaiements(payData.paiements ?? [])
      setAbonnes(abData.abonnes ?? [])
    } catch {
      toast.error('Erreur de chargement des paiements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthPay = paiements.filter(p => p.moisConcerne === currentMonth)
  const totalMois = currentMonthPay.reduce((s, p) => s + p.montant, 0)
  const totalMM = currentMonthPay.filter(p => p.moyen === 'mobile-money').reduce((s, p) => s + p.montant, 0)
  const totalCash = currentMonthPay.filter(p => p.moyen === 'espèces').reduce((s, p) => s + p.montant, 0)
  const actifs = abonnes.filter(a => a.statut !== 'inactif').length
  const taux = actifs > 0 ? Math.round((currentMonthPay.length / actifs) * 100) : 0

  // Recouvrement by zone (from paiements data)
  const zoneMap = new Map<string, { nom: string; abonnes: number; payes: number }>()
  abonnes.forEach(a => {
    if (!zoneMap.has(a.zone.id)) zoneMap.set(a.zone.id, { nom: a.zone.nom, abonnes: 0, payes: 0 })
    zoneMap.get(a.zone.id)!.abonnes++
  })
  currentMonthPay.forEach(p => {
    const zid = p.abonne.zone.id
    if (zoneMap.has(zid)) zoneMap.get(zid)!.payes++
  })
  const recouvByZone = [...zoneMap.entries()].map(([id, v]) => ({
    id, ...v, taux: v.abonnes > 0 ? Math.round((v.payes / v.abonnes) * 100) : 0,
  }))

  const impayes = abonnes.filter(a => a.statut === 'impayé' || a.statut === 'en-retard')
  const availableMonths = [...new Set(paiements.map(p => p.moisConcerne))].sort().reverse()
  const zones = [...new Map(abonnes.map(a => [a.zone.id, a.zone])).values()]

  const filtered = paiements.filter(p => {
    const matchMois = filterMois === 'tous' || p.moisConcerne === filterMois
    const matchZone = filterZone === 'toutes' || p.abonne.zone.id === filterZone
    const matchMode = filterMode === 'tous' || p.moyen === filterMode
    return matchMois && matchZone && matchMode
  }).sort((a, b) => b.date.localeCompare(a.date))

  const handleExportImpayes = () => {
    const csv = [
      ['Nom', 'Prénom', 'Téléphone', 'Zone', 'Statut'].join(','),
      ...impayes.map(a => [a.nom, a.prenom, a.telephone, a.zone.nom, a.statut].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'impayes-wasteflow.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export impayés téléchargé')
  }

  if (loading) {
    return (
      <div className="space-y-5 max-w-5xl animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className={cn('text-2xl font-bold tabular-nums', taux >= 80 ? 'text-emerald-600' : taux >= 60 ? 'text-amber-600' : 'text-red-600')}>
            {taux}%
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Taux recouvrement (mois en cours)</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold tabular-nums text-gray-900">{formatFCFA(totalMois)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Encaissé ce mois ({currentMonthPay.length} paiements)</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold tabular-nums text-blue-600">{formatFCFA(totalMM)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Mobile Money (T-Money/Flooz/Moov)</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold tabular-nums text-gray-700">{formatFCFA(totalCash)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Espèces (cash terrain)</div>
        </div>
      </div>

      {/* Recouvrement by zone */}
      {recouvByZone.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Recouvrement par zone — {currentMonth}
          </h3>
          <div className="space-y-3">
            {recouvByZone.map(r => (
              <div key={r.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 font-medium">{r.nom}</span>
                  <span className="text-xs text-gray-500">
                    {r.payes}/{r.abonnes} abonnés —{' '}
                    <span className={cn('font-bold', r.taux >= 80 ? 'text-emerald-600' : r.taux >= 60 ? 'text-amber-600' : 'text-red-600')}>
                      {r.taux}%
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full', r.taux >= 80 ? 'bg-emerald-500' : r.taux >= 60 ? 'bg-amber-400' : 'bg-red-500')}
                    style={{ width: `${r.taux}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Paiements list */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
            <h3 className="text-sm font-semibold text-gray-900 flex-1">Tous les paiements</h3>
            <select value={filterMois} onChange={e => setFilterMois(e.target.value)} className="h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none">
              <option value="tous">Tous les mois</option>
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filterZone} onChange={e => setFilterZone(e.target.value)} className="h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none">
              <option value="toutes">Toutes zones</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
            </select>
            <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className="h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none">
              <option value="tous">Tous modes</option>
              <option value="mobile-money">Mobile Money</option>
              <option value="espèces">Cash</option>
            </select>
          </div>
          <table className="w-full table-dense">
            <thead>
              <tr>
                <th className="text-left">Abonné</th>
                <th className="text-left">Mois</th>
                <th className="text-left hidden sm:table-cell">Mode</th>
                <th className="text-right">Montant</th>
                <th className="text-left hidden md:table-cell">Réf.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map(p => {
                const opConfig = p.operateur ? OPERATEUR_MM[p.operateur] : null
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="font-medium text-sm text-gray-900">{p.abonne.prenom} {p.abonne.nom}</div>
                      <div className="text-xs text-gray-400">{formatDate(p.date)}</div>
                    </td>
                    <td className="text-xs text-gray-600">{p.moisConcerne}</td>
                    <td className="hidden sm:table-cell">
                      {p.moyen === 'mobile-money' && opConfig ? (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-700">
                          {opConfig.label}
                        </span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-gray-50 text-gray-600">
                          {p.moyen === 'espèces' ? 'Cash' : p.moyen}
                        </span>
                      )}
                    </td>
                    <td className="text-right font-mono text-sm font-semibold text-gray-900">
                      {formatFCFA(p.montant)}
                    </td>
                    <td className="hidden md:table-cell font-mono text-xs text-gray-400">{p.reference}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">Aucun paiement trouvé.</div>
          )}
        </div>

        {/* Impayés */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Impayés <span className="text-red-600 ml-1">{impayes.length}</span>
            </h3>
            <Button size="sm" variant="ghost" onClick={handleExportImpayes}>
              <Download size={12} /> Export
            </Button>
          </div>
          <div className="divide-y divide-gray-50">
            {impayes.map(a => (
              <div key={a.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{a.prenom} {a.nom}</div>
                  <div className="text-xs text-gray-400">{a.zone.nom}</div>
                </div>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded font-medium border',
                  a.statut === 'impayé' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100',
                )}>
                  {a.statut === 'impayé' ? 'Impayé' : 'En retard'}
                </span>
              </div>
            ))}
          </div>
          {impayes.length === 0 && (
            <div className="text-center py-8 text-emerald-600 text-sm">
              Tous les abonnés sont à jour !
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
