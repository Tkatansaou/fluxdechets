'use client'

import { useState } from 'react'
import { Truck, Users, CreditCard, Route, BarChart3, FileText } from 'lucide-react'
import { mockData } from '@/lib/mock-data'
import { cn, formatFCFA } from '@/lib/utils'

export default function CommunePage() {
  const state = mockData
  const org = state.organisation

  const actifs = state.abonnes.filter(a => a.actif && a.statut !== 'inactif').length
  const aJour = state.abonnes.filter(a => a.statut === 'à-jour').length
  const tauxRecouv = actifs > 0 ? Math.round((aJour / actifs) * 100) : 0

  const tournees = state.tournees
  const eff = tournees.filter(t => t.statut === 'terminée').length
  const tot = tournees.filter(t => t.statut !== 'annulée').length
  const tauxCollecte = tot > 0 ? Math.round((eff / tot) * 100) : 100

  const enginsOp = state.engins.filter(e => e.statut === 'opérationnel').length
  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className="min-h-screen bg-[#F2F4F0]">
      {/* Header officiel */}
      <header className="bg-[#0B1F16] text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Truck size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-lg">WasteFlow — Espace Commune</div>
            <div className="text-green-300 text-sm">Tableau de bord DSP — {org.commune} · Lecture seule</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            <span className="text-sm text-green-300">Données en direct</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Délégataire info */}
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">{org.nom}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Contrat DSP N° {org.num_contrat} · Signé le {new Date(org.date_contrat).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Objectifs contractuels</div>
              <div className="text-sm font-medium text-gray-700 mt-0.5">
                {org.objectif_abonnes} abonnés · {org.objectif_recouvrement}% recouvrement · {org.objectif_collecte}% collecte
              </div>
            </div>
          </div>
        </div>

        {/* KPIs principaux */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Indicateurs clés de performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                titre: 'Abonnés actifs',
                valeur: actifs,
                objectif: org.objectif_abonnes,
                suffix: '',
                icon: Users,
                ok: actifs >= org.objectif_abonnes * 0.8,
              },
              {
                titre: 'Taux de recouvrement',
                valeur: tauxRecouv,
                objectif: org.objectif_recouvrement,
                suffix: '%',
                icon: CreditCard,
                ok: tauxRecouv >= org.objectif_recouvrement,
              },
              {
                titre: 'Taux de collecte',
                valeur: tauxCollecte,
                objectif: org.objectif_collecte,
                suffix: '%',
                icon: Route,
                ok: tauxCollecte >= org.objectif_collecte,
              },
              {
                titre: 'Engins opérationnels',
                valeur: enginsOp,
                objectif: state.engins.length,
                suffix: `/${state.engins.length}`,
                icon: Truck,
                ok: enginsOp === state.engins.length,
              },
            ].map(kpi => {
              const Icon = kpi.icon
              const pct = typeof kpi.objectif === 'number' && kpi.suffix !== `/${state.engins.length}`
                ? Math.min(Math.round((kpi.valeur / kpi.objectif) * 100), 100)
                : null

              return (
                <div key={kpi.titre} className={cn(
                  'bg-white border rounded-xl p-4',
                  kpi.ok ? 'border-emerald-200' : 'border-amber-200',
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn('p-1.5 rounded-md', kpi.ok ? 'bg-emerald-50' : 'bg-amber-50')}>
                      <Icon size={16} className={kpi.ok ? 'text-emerald-600' : 'text-amber-600'} />
                    </div>
                    <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', kpi.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                      {kpi.ok ? 'Conforme' : 'À améliorer'}
                    </span>
                  </div>
                  <div className={cn('text-2xl font-bold tabular-nums', kpi.ok ? 'text-emerald-700' : 'text-amber-700')}>
                    {kpi.valeur}{kpi.suffix}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{kpi.titre}</div>
                  {pct !== null && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={cn('h-1.5 rounded-full', kpi.ok ? 'bg-emerald-500' : 'bg-amber-400')} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{pct}% de l'objectif</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Engins */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">État des engins</h3>
          </div>
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
                  <td className="text-xs text-gray-600">{e.marque} {e.modele} ({e.annee})</td>
                  <td className="text-right font-mono">{e.kilometrage.toLocaleString()} km</td>
                  <td>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-semibold',
                      e.statut === 'opérationnel' ? 'bg-emerald-100 text-emerald-700' :
                        e.statut === 'en-panne' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
                    )}>
                      {e.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rapports */}
        {state.rapports.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Rapports trimestriels</h3>
            </div>
            <table className="w-full table-dense">
              <thead>
                <tr>
                  <th className="text-left">Trimestre</th>
                  <th className="text-left">Taux recouv.</th>
                  <th className="text-left">Taux collecte</th>
                  <th className="text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {state.rapports.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">T{r.trimestre} {r.annee}</td>
                    <td className={cn('font-bold', r.donnees.taux_recouvrement_global >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                      {r.donnees.taux_recouvrement_global}%
                    </td>
                    <td className={cn('font-bold', r.donnees.taux_collecte >= 99 ? 'text-emerald-600' : 'text-amber-600')}>
                      {r.donnees.taux_collecte}%
                    </td>
                    <td>
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{r.statut}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 text-xs text-gray-400">
          Données fournies par WasteFlow · Accès lecture seule accordé par {org.nom} · {new Date().toLocaleDateString('fr-FR')}
        </div>
      </main>
    </div>
  )
}
