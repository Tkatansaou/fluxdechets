'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Users, CreditCard, Route, Truck,
  TrendingUp, ChevronRight, ArrowRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn, formatFCFA, formatDate } from '@/lib/utils'

const RecouvChart = dynamic(() => import('./RecouvChart'), { ssr: false })

type KpiData = {
  abonnesActifs: number
  objectifAbonnes: number
  tauxRecouvrement: number
  objectifRecouvrement: number
  tauxCollecte: number
  objectifCollecte: number
  enginsOperationnels: number
  enginsTotal: number
  alertesCount: number
  recouvrementParMois: { mois: string; taux: number }[]
  encaisseMoisMontant: number
  encaisseMoisCount: number
}

type Alerte = {
  id: string
  type: string
  titre: string
  description: string
  date: string
  gravite: 'critique' | 'attention' | 'info'
  lien?: string
}

type PaiementRecent = {
  id: string
  montant: number
  moyen: string
  operateur?: string | null
  date: string
  abonne: { nom: string; prenom: string }
}

function KpiCard({
  titre, valeur, sous_valeur, objectif, icon: Icon, href, couleur, unite = '',
}: {
  titre: string
  valeur: number | string
  sous_valeur?: string
  objectif?: number
  icon: React.ElementType
  href: string
  couleur: 'vert' | 'orange' | 'rouge' | 'bleu'
  unite?: string
}) {
  const colors = {
    vert: { bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700', border: 'border-emerald-200' },
    orange: { bg: 'bg-amber-50', icon: 'text-amber-600', val: 'text-amber-700', border: 'border-amber-200' },
    rouge: { bg: 'bg-red-50', icon: 'text-red-600', val: 'text-red-700', border: 'border-red-200' },
    bleu: { bg: 'bg-blue-50', icon: 'text-blue-600', val: 'text-blue-700', border: 'border-blue-200' },
  }
  const c = colors[couleur]

  return (
    <Link href={href} className="block group">
      <div className={cn(
        'bg-white rounded-lg border p-4 transition-shadow hover:shadow-md',
        couleur !== 'bleu' && couleur !== 'vert' ? `border-l-4 ${c.border.replace('border-', 'border-l-')}` : 'border-gray-200',
      )}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className={cn('p-1.5 rounded-md', c.bg)}>
            <Icon size={16} className={c.icon} />
          </div>
          <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 mt-0.5 flex-shrink-0" />
        </div>
        <div className={cn('kpi-value mb-0.5', c.val)}>
          {typeof valeur === 'number' ? valeur.toLocaleString('fr-TG') : valeur}
          {unite && <span className="text-lg ml-0.5">{unite}</span>}
        </div>
        <div className="text-xs font-medium text-gray-600 leading-tight">{titre}</div>
        {(sous_valeur || objectif !== undefined) && (
          <div className="text-xs text-gray-400 mt-1">
            {sous_valeur}
            {objectif !== undefined && (
              <span className={cn(
                'ml-1 font-medium',
                typeof valeur === 'number' && valeur >= objectif ? 'text-emerald-600' : 'text-amber-600',
              )}>
                (objectif : {objectif}{unite})
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

function AlerteRow({ alerte }: { alerte: Alerte }) {
  const icons: Record<string, string> = {
    'panne-engin': '🔧',
    'zone-non-couverte': '⚠️',
    'stock-bas': '📦',
    'recouvrement-faible': '📉',
    'impayé-multiple': '💸',
  }
  const bgColors = {
    critique: 'bg-red-50 border-red-100',
    attention: 'bg-amber-50 border-amber-100',
    info: 'bg-blue-50 border-blue-100',
  }

  return (
    <Link href={alerte.lien ?? '#'} className="block">
      <div className={cn(
        'flex items-start gap-3 p-3 rounded-md border text-sm hover:opacity-80 transition-opacity',
        bgColors[alerte.gravite],
      )}>
        <span className="text-base flex-shrink-0 mt-0.5">{icons[alerte.type] ?? '•'}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800 text-xs">{alerte.titre}</div>
          <div className="text-gray-500 text-xs mt-0.5 truncate">{alerte.description}</div>
        </div>
        <div className="text-xs text-gray-400 flex-shrink-0">{formatDate(alerte.date)}</div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [recentPaiements, setRecentPaiements] = useState<PaiementRecent[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [kpiRes, paiRes] = await Promise.all([
        api<{ kpis: KpiData; alertes: Alerte[] }>('/api/kpis'),
        api<{ paiements: PaiementRecent[] }>('/api/paiements?limit=6'),
      ])
      setKpis(kpiRes.kpis)
      setAlertes(kpiRes.alertes)
      setRecentPaiements(paiRes.paiements.slice(0, 6))
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-5 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (!kpis) return null

  const couleurRecouv: 'vert' | 'orange' | 'rouge' = kpis.tauxRecouvrement >= kpis.objectifRecouvrement ? 'vert' : kpis.tauxRecouvrement >= 60 ? 'orange' : 'rouge'
  const couleurCollecte: 'vert' | 'orange' | 'rouge' = kpis.tauxCollecte >= kpis.objectifCollecte ? 'vert' : kpis.tauxCollecte >= 85 ? 'orange' : 'rouge'
  const couleurEngins: 'vert' | 'orange' | 'rouge' = kpis.enginsOperationnels === kpis.enginsTotal ? 'vert' : kpis.enginsOperationnels > 0 ? 'orange' : 'rouge'

  return (
    <div className="space-y-5 max-w-5xl">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          titre="Abonnés actifs"
          valeur={kpis.abonnesActifs}
          sous_valeur={`objectif ${kpis.objectifAbonnes}`}
          icon={Users}
          href="/abonnes"
          couleur="bleu"
        />
        <KpiCard
          titre="Taux de recouvrement"
          valeur={kpis.tauxRecouvrement}
          unite="%"
          objectif={kpis.objectifRecouvrement}
          icon={CreditCard}
          href="/paiements"
          couleur={couleurRecouv}
        />
        <KpiCard
          titre="Taux de collecte"
          valeur={kpis.tauxCollecte}
          unite="%"
          objectif={kpis.objectifCollecte}
          icon={Route}
          href="/tournees"
          couleur={couleurCollecte}
        />
        <KpiCard
          titre="Engins opérationnels"
          valeur={`${kpis.enginsOperationnels}/${kpis.enginsTotal}`}
          sous_valeur={kpis.enginsOperationnels === kpis.enginsTotal ? 'Tous opérationnels' : `${kpis.enginsTotal - kpis.enginsOperationnels} hors service`}
          icon={Truck}
          href="/engins"
          couleur={couleurEngins}
        />
        <KpiCard
          titre="Encaissé ce mois"
          valeur={formatFCFA(kpis.encaisseMoisMontant)}
          sous_valeur={`${kpis.encaisseMoisCount} paiements`}
          icon={TrendingUp}
          href="/paiements"
          couleur="vert"
        />
      </div>

      {/* Conformité contractuelle */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Abonnés vs objectif', val: Math.round((kpis.abonnesActifs / kpis.objectifAbonnes) * 100) },
          { label: 'Recouvrement vs objectif', val: Math.round((kpis.tauxRecouvrement / kpis.objectifRecouvrement) * 100) },
          { label: 'Collecte vs objectif', val: Math.round((kpis.tauxCollecte / kpis.objectifCollecte) * 100) },
        ].map(item => (
          <div key={item.label} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 truncate">{item.label}</span>
              <span className={cn(
                'text-xs font-bold',
                item.val >= 100 ? 'text-emerald-600' : item.val >= 80 ? 'text-amber-600' : 'text-red-600',
              )}>
                {Math.min(item.val, 999)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  item.val >= 100 ? 'bg-emerald-500' : item.val >= 80 ? 'bg-amber-400' : 'bg-red-500',
                )}
                style={{ width: `${Math.min(item.val, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recouvrement mensuel</h3>
              <p className="text-xs text-gray-400 mt-0.5">6 derniers mois — seuil contractuel {kpis.objectifRecouvrement}%</p>
            </div>
            <Link href="/paiements" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Détails <ArrowRight size={12} />
            </Link>
          </div>
          <RecouvChart data={kpis.recouvrementParMois} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Alertes actives
              {alertes.length > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                  {alertes.length}
                </span>
              )}
            </h3>
          </div>
          {alertes.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-2xl mb-1">✓</div>
              <p className="text-xs text-gray-500">Aucune alerte — tout est nominal</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertes.map(a => <AlerteRow key={a.id} alerte={a} />)}
            </div>
          )}
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Activité récente</h3>
          <Link href="/paiements" className="text-xs text-brand-600 hover:underline">Voir tout</Link>
        </div>
        {recentPaiements.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">Aucun paiement enregistré</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Abonné</th>
                <th className="text-left">Type</th>
                <th className="text-left hidden sm:table-cell">Mode</th>
                <th className="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {recentPaiements.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-gray-900">
                    {p.abonne ? `${p.abonne.prenom} ${p.abonne.nom}` : '—'}
                  </td>
                  <td>
                    <span className="text-xs text-emerald-600">Paiement validé</span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded font-medium',
                      p.moyen === 'mobile-money' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600',
                    )}>
                      {p.moyen === 'mobile-money' ? (p.operateur?.toUpperCase() ?? 'MM') : 'Cash'}
                    </span>
                  </td>
                  <td className="text-right font-mono text-sm font-medium text-gray-900">
                    {formatFCFA(p.montant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
