'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, RefreshCw } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { cn, formatDate, formatFCFA } from '@/lib/utils'
import toast from 'react-hot-toast'

interface RapportDonnees {
  abonnes_actifs: number
  montant_total: number
  montant_mobile_money: number
  montant_especes: number
  taux_recouvrement_global: number
  taux_collecte: number
  tournees_total: number
  tournees_terminees: number
  engins: { immatriculation: string; statut: string; kilometrage: number }[]
  pannes_count: number
  pannes_cout_total: number
  generated_at: string
}

interface Rapport {
  id: string; trimestre: string; annee: number; statut: string
  donnees: RapportDonnees | null; generatedAt: string | null; createdAt: string
}

const QUARTERS = [
  { id: 'T1', label: 'T1 (Jan–Mar)' },
  { id: 'T2', label: 'T2 (Avr–Jun)' },
  { id: 'T3', label: 'T3 (Jul–Sep)' },
  { id: 'T4', label: 'T4 (Oct–Déc)' },
]

export default function RapportsPage() {
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedQ, setSelectedQ] = useState('T2')
  const [selectedY, setSelectedY] = useState(new Date().getFullYear())
  const currentRapport = rapports.find(r => r.trimestre === selectedQ && r.annee === selectedY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api<{ rapports: Rapport[] }>('/api/rapports')
      setRapports(res.rapports ?? [])
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await api<{ rapport: Rapport }>('/api/rapports', {
        method: 'POST',
        body: { trimestre: selectedQ, annee: selectedY },
      })
      setRapports(prev => {
        const filtered = prev.filter(r => !(r.trimestre === selectedQ && r.annee === selectedY))
        return [...filtered, res.rapport]
      })
      toast.success(`Rapport ${selectedQ} ${selectedY} généré`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur de génération')
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
    toast.success('Fenêtre d\'impression ouverte')
  }

  const d = currentRapport?.donnees
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="max-w-4xl space-y-5">
      {/* Sélecteur */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Trimestre</label>
            <div className="flex gap-1.5">
              {QUARTERS.map(q => (
                <button key={q.id} onClick={() => setSelectedQ(q.id)}
                  className={cn('px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    selectedQ === q.id ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400')}>
                  {q.id}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Année</label>
            <select value={selectedY} onChange={e => setSelectedY(Number(e.target.value))}
              className="h-9 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm" loading={generating} onClick={handleGenerate}>
              <RefreshCw size={13} /> {currentRapport ? 'Régénérer' : 'Générer'}
            </Button>
            {currentRapport && <Button variant="ghost" size="sm" onClick={handlePrint}><Download size={13} /> Imprimer</Button>}
          </div>
        </div>
      </div>

      {/* Rapport */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      ) : !currentRapport ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <FileText size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">Aucun rapport généré pour {selectedQ} {selectedY}</p>
          <Button variant="primary" loading={generating} onClick={handleGenerate}>Générer le rapport</Button>
        </div>
      ) : !d ? (
        <div className="text-center py-12 text-gray-400 text-sm">Données du rapport indisponibles</div>
      ) : (
        <div className="space-y-4" id="rapport-print">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Abonnés actifs', val: d.abonnes_actifs, sub: '' },
              { label: 'Montant encaissé', val: formatFCFA(d.montant_total), sub: '' },
              { label: 'Taux recouvrement', val: `${d.taux_recouvrement_global}%`, sub: '' },
              { label: 'Taux collecte', val: `${d.taux_collecte}%`, sub: '' },
            ].map(k => (
              <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{k.val}</div>
                <div className="text-xs text-gray-500 mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Paiements */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recouvrement {selectedQ} {selectedY}</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-xl font-bold text-gray-900">{formatFCFA(d.montant_total)}</div><div className="text-xs text-gray-500">Total encaissé</div></div>
              <div><div className="text-xl font-bold text-emerald-600">{formatFCFA(d.montant_mobile_money)}</div><div className="text-xs text-gray-500">Mobile Money</div></div>
              <div><div className="text-xl font-bold text-blue-600">{formatFCFA(d.montant_especes)}</div><div className="text-xs text-gray-500">Espèces</div></div>
            </div>
          </div>

          {/* Tournées */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tournées de collecte</h3>
            <div className="flex items-center gap-8">
              <div className="text-center"><div className="text-2xl font-bold text-gray-900">{d.tournees_terminees}/{d.tournees_total}</div><div className="text-xs text-gray-500">Tournées effectuées</div></div>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div className="bg-brand-600 h-3 rounded-full" style={{ width: `${d.taux_collecte}%` }} />
              </div>
              <div className="text-lg font-bold text-brand-700">{d.taux_collecte}%</div>
            </div>
          </div>

          {/* Engins */}
          {d.engins.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">État de la flotte</div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Engin</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Statut</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2">Kilométrage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {d.engins.map((e, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{e.immatriculation}</td>
                      <td className="px-4 py-2.5 text-xs capitalize text-gray-600">{e.statut}</td>
                      <td className="px-4 py-2.5 text-sm text-right text-gray-700">{e.kilometrage.toLocaleString()} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-right text-xs text-gray-400">
            Généré le {currentRapport.generatedAt ? formatDate(currentRapport.generatedAt) : '—'} · Statut : {currentRapport.statut}
          </div>
        </div>
      )}

      {/* Liste des rapports existants */}
      {rapports.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">Historique des rapports</div>
          <div className="divide-y divide-gray-50">
            {rapports.map(r => (
              <div key={r.id} className={cn('flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50', r.trimestre === selectedQ && r.annee === selectedY && 'bg-brand-50')}
                onClick={() => { setSelectedQ(r.trimestre); setSelectedY(r.annee) }}>
                <div>
                  <span className="text-sm font-medium text-gray-900">{r.trimestre} {r.annee}</span>
                  <span className={cn('ml-2 text-xs px-1.5 py-0.5 rounded', r.statut === 'brouillon' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>{r.statut}</span>
                </div>
                <span className="text-xs text-gray-400">{r.generatedAt ? formatDate(r.generatedAt) : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
