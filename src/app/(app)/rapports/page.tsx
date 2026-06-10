'use client'

import { useState } from 'react'
import { FileText, Download, Eye, BarChart2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { cn, formatDate, formatFCFA } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function RapportsPage() {
  const { state } = useApp()
  const [selectedQ, setSelectedQ] = useState('T2-2026')
  const [previewOpen, setPreviewOpen] = useState(false)

  const quarters = [
    { id: 'T1-2026', label: 'T1 2026 (Jan–Mar)', months: ['2026-01', '2026-02', '2026-03'] },
    { id: 'T2-2026', label: 'T2 2026 (Avr–Jun)', months: ['2026-04', '2026-05', '2026-06'] },
  ]
  const quarter = quarters.find(q => q.id === selectedQ) ?? quarters[0]

  // Calculer les données du rapport
  const paiementsTrimestre = state.paiements.filter(p =>
    quarter.months.includes(p.mois_concerne) && p.statut === 'validé'
  )
  const montantMM = paiementsTrimestre.filter(p => p.moyen === 'mobile-money').reduce((s, p) => s + p.montant, 0)
  const montantCash = paiementsTrimestre.filter(p => p.moyen === 'espèces').reduce((s, p) => s + p.montant, 0)
  const montantTotal = montantMM + montantCash

  const actifs = state.abonnes.filter(a => a.actif && a.statut !== 'inactif')
  const tauxParMois = quarter.months.map(mois => {
    const pays = paiementsTrimestre.filter(p => p.mois_concerne === mois).length
    const taux = actifs.length > 0 ? Math.round((pays / actifs.length) * 100) : 0
    return { mois, taux, pays }
  })
  const tauxMoyenRecouv = Math.round(tauxParMois.reduce((s, m) => s + m.taux, 0) / tauxParMois.length)

  const tourneesT = state.tournees.filter(t =>
    quarter.months.some(m => t.date.startsWith(m))
  )
  const tourneesEff = tourneesT.filter(t => t.statut === 'terminée').length
  const tourneesTot = tourneesT.filter(t => t.statut !== 'annulée').length
  const tauxCollecte = tourneesTot > 0 ? Math.round((tourneesEff / tourneesTot) * 100) : 100

  const pannesTrimestre = state.pannes.filter(p =>
    quarter.months.some(m => p.date.startsWith(m))
  )

  const handlePrint = () => {
    window.print()
    toast.success('Fenêtre d\'impression ouverte')
  }

  const savedRapports = state.rapports

  return (
    <div className="max-w-4xl space-y-5">
      {/* Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Période du rapport</label>
            <select
              value={selectedQ}
              onChange={e => setSelectedQ(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {quarters.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye size={13} /> Prévisualiser
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint}>
              <Download size={13} /> Exporter PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Données calculées */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className={cn('text-2xl font-bold', tauxMoyenRecouv >= 80 ? 'text-emerald-600' : 'text-amber-600')}>{tauxMoyenRecouv}%</div>
          <div className="text-xs text-gray-500">Taux recouvrement moyen</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className={cn('text-2xl font-bold', tauxCollecte >= 99 ? 'text-emerald-600' : 'text-amber-600')}>{tauxCollecte}%</div>
          <div className="text-xs text-gray-500">Taux de collecte</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{formatFCFA(montantTotal)}</div>
          <div className="text-xs text-gray-500">Montant total encaissé</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{actifs.length}</div>
          <div className="text-xs text-gray-500">Abonnés actifs</div>
        </div>
      </div>

      {/* Recouvrement par mois */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recouvrement mensuel du trimestre</h3>
        <div className="space-y-3">
          {tauxParMois.map(m => (
            <div key={m.mois} className="flex items-center gap-4">
              <div className="w-20 text-xs font-medium text-gray-600 text-right">{m.mois}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div
                      className={cn('h-3 rounded-full', m.taux >= 80 ? 'bg-emerald-500' : m.taux >= 60 ? 'bg-amber-400' : 'bg-red-500')}
                      style={{ width: `${m.taux}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-bold w-10 text-right', m.taux >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                    {m.taux}%
                  </span>
                </div>
                <div className="text-xs text-gray-400">{m.pays} paiement(s) enregistré(s)</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incidents */}
      {pannesTrimestre.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Incidents engins ce trimestre</h3>
          <div className="space-y-2">
            {pannesTrimestre.map(p => {
              const engin = state.engins.find(e => e.id === p.engin_id)
              return (
                <div key={p.id} className="flex items-start gap-3 text-sm">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0">{formatDate(p.date)}</span>
                  <span className="text-gray-700">
                    <span className="font-medium">{engin?.immatriculation}</span> — {p.description}
                    {p.statut === 'résolue' && <span className="text-emerald-600 ml-2">(résolu le {formatDate(p.date_resolution!)})</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* État des engins */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">État des engins</h3>
        <table className="w-full table-dense">
          <thead>
            <tr>
              <th className="text-left">Immatriculation</th>
              <th className="text-left">Type</th>
              <th className="text-right">Kilométrage</th>
              <th className="text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {state.engins.map(e => (
              <tr key={e.id}>
                <td className="font-bold text-gray-900">{e.immatriculation}</td>
                <td className="text-xs text-gray-600">{e.marque} {e.modele}</td>
                <td className="text-right font-mono font-medium">{e.kilometrage.toLocaleString()} km</td>
                <td>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-medium',
                    e.statut === 'opérationnel' ? 'bg-emerald-50 text-emerald-700' :
                      e.statut === 'en-panne' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700',
                  )}>
                    {e.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rapports sauvegardés */}
      {savedRapports.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Rapports précédents</h3>
          </div>
          <table className="w-full table-dense">
            <thead>
              <tr>
                <th className="text-left">Trimestre</th>
                <th className="text-left">Taux recouv.</th>
                <th className="text-left">Taux collecte</th>
                <th className="text-right">Montant</th>
                <th className="text-left">Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedRapports.map(r => (
                <tr key={r.id}>
                  <td className="font-medium text-gray-900">T{r.trimestre} {r.annee}</td>
                  <td className={cn('font-bold', r.donnees.taux_recouvrement_global >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                    {r.donnees.taux_recouvrement_global}%
                  </td>
                  <td className={cn('font-bold', r.donnees.taux_collecte >= 99 ? 'text-emerald-600' : 'text-amber-600')}>
                    {r.donnees.taux_collecte}%
                  </td>
                  <td className="text-right font-mono font-semibold">{formatFCFA(r.donnees.montant_total)}</td>
                  <td>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', r.statut === 'finalisé' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600')}>
                      {r.statut}
                    </span>
                  </td>
                  <td className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => { window.print(); toast.success('Impression lancée') }}>
                      <FileText size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Printable report - hidden until print */}
      <div className="hidden print:block">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{state.organisation.nom}</h1>
          <h2 className="text-xl mt-1">Rapport trimestriel DSP — {quarter.label}</h2>
          <p className="text-sm text-gray-600 mt-1">Contrat {state.organisation.num_contrat} · {state.organisation.commune}</p>
        </div>
        {/* Report content would go here */}
      </div>
    </div>
  )
}
