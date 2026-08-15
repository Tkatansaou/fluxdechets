'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  PackageOpen,
  Plus,
  RefreshCw,
  Route,
  TriangleAlert,
  TrendingUp,
  Truck,
  Users,
  Wrench,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
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

type KpiColor = 'vert' | 'orange' | 'rouge' | 'bleu'

function KpiCard({
  titre,
  valeur,
  sousValeur,
  objectif,
  icon: Icon,
  href,
  couleur,
  unite = '',
}: {
  titre: string
  valeur: number | string
  sousValeur?: string
  objectif?: number
  icon: React.ElementType
  href: string
  couleur: KpiColor
  unite?: string
}) {
  const colors = {
    vert: { iconBg: 'bg-emerald-50', icon: 'text-emerald-700', accent: 'bg-emerald-600', value: 'text-emerald-800' },
    orange: { iconBg: 'bg-amber-50', icon: 'text-amber-700', accent: 'bg-amber-500', value: 'text-amber-800' },
    rouge: { iconBg: 'bg-red-50', icon: 'text-red-700', accent: 'bg-red-600', value: 'text-red-800' },
    bleu: { iconBg: 'bg-blue-50', icon: 'text-blue-700', accent: 'bg-blue-600', value: 'text-slate-900' },
  }
  const color = colors[couleur]

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span className={cn('absolute inset-x-0 top-0 h-0.5', color.accent)} />
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className={cn('rounded-lg p-2', color.iconBg)}>
          <Icon size={17} className={color.icon} strokeWidth={2.1} />
        </div>
        <ChevronRight size={15} className="mt-1 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
      </div>
      <div className={cn('text-[26px] font-bold leading-none tracking-tight tabular-nums', color.value)}>
        {typeof valeur === 'number' ? valeur.toLocaleString('fr-TG') : valeur}
        {unite && <span className="ml-0.5 text-base font-semibold">{unite}</span>}
      </div>
      <div className="mt-2 text-xs font-semibold text-gray-700">{titre}</div>
      {(sousValeur || objectif !== undefined) && (
        <div className="mt-1.5 min-h-4 text-[11px] leading-tight text-gray-400">
          {sousValeur}
          {objectif !== undefined && (
            <span className="ml-1">Cible {objectif}{unite}</span>
          )}
        </div>
      )}
    </Link>
  )
}

const alertIcons: Record<string, React.ElementType> = {
  'panne-engin': Wrench,
  'zone-non-couverte': TriangleAlert,
  'stock-bas': PackageOpen,
  'recouvrement-faible': BarChart3,
  'impayé-multiple': CircleDollarSign,
}

function AlerteRow({ alerte }: { alerte: Alerte }) {
  const severity = {
    critique: { row: 'border-red-200 bg-red-50/70', icon: 'bg-red-100 text-red-700' },
    attention: { row: 'border-amber-200 bg-amber-50/70', icon: 'bg-amber-100 text-amber-700' },
    info: { row: 'border-blue-200 bg-blue-50/70', icon: 'bg-blue-100 text-blue-700' },
  }
  const AlertIcon = alertIcons[alerte.type] ?? TriangleAlert
  const content = (
    <div className={cn('flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-white', severity[alerte.gravite].row)}>
      <span className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', severity[alerte.gravite].icon)}>
        <AlertIcon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-gray-900">{alerte.titre}</div>
        <div className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{alerte.description}</div>
      </div>
      <div className="flex-shrink-0 text-[10px] text-gray-400">{formatDate(alerte.date)}</div>
    </div>
  )

  return alerte.lien ? <Link href={alerte.lien}>{content}</Link> : content
}

function progressValue(value: number, objective: number) {
  if (objective <= 0) return 0
  return Math.round((value / objective) * 100)
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [recentPaiements, setRecentPaiements] = useState<PaiementRecent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [kpiRes, paiRes] = await Promise.all([
        api<{ kpis: KpiData; alertes: Alerte[] }>('/api/kpis'),
        api<{ paiements: PaiementRecent[] }>('/api/paiements?limit=6'),
      ])
      setKpis(kpiRes.kpis)
      setAlertes(kpiRes.alertes)
      setRecentPaiements(paiRes.paiements.slice(0, 6))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5" aria-busy="true" aria-label="Chargement du tableau de bord">
        <div className="h-20 animate-pulse rounded-xl border border-gray-200 bg-white" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
        </div>
      </div>
    )
  }

  if (error || !kpis) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <TriangleAlert size={22} />
          </div>
          <h2 className="mt-4 text-base font-bold text-gray-900">Données temporairement indisponibles</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
            Vérifiez votre connexion puis relancez le chargement du tableau de bord.
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <RefreshCw size={15} />
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const couleurRecouv: KpiColor = kpis.tauxRecouvrement >= kpis.objectifRecouvrement ? 'vert' : kpis.tauxRecouvrement >= 60 ? 'orange' : 'rouge'
  const couleurCollecte: KpiColor = kpis.tauxCollecte >= kpis.objectifCollecte ? 'vert' : kpis.tauxCollecte >= 85 ? 'orange' : 'rouge'
  const couleurEngins: KpiColor = kpis.enginsOperationnels === kpis.enginsTotal ? 'vert' : kpis.enginsOperationnels > 0 ? 'orange' : 'rouge'
  const firstName = user?.name?.split(' ')[0]
  const monthLabel = new Intl.DateTimeFormat('fr-TG', { month: 'long', year: 'numeric' }).format(new Date())
  const progressItems = [
    { label: 'Abonnés vs objectif', value: progressValue(kpis.abonnesActifs, kpis.objectifAbonnes) },
    { label: 'Recouvrement vs objectif', value: progressValue(kpis.tauxRecouvrement, kpis.objectifRecouvrement) },
    { label: 'Collecte vs objectif', value: progressValue(kpis.tauxCollecte, kpis.objectifCollecte) },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-5 fade-in">
      <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">Situation opérationnelle</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-950">
            Bonjour{firstName ? `, ${firstName}` : ''}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Synthèse de {monthLabel}. {alertes.length > 0 ? `${alertes.length} alerte${alertes.length > 1 ? 's' : ''} à traiter.` : 'Tous les indicateurs critiques sont sous contrôle.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tournees/terrain"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ClipboardCheck size={15} />
            Saisie terrain
          </Link>
          <Link
            href="/abonnes/nouveau"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Plus size={15} />
            Nouvel abonné
          </Link>
        </div>
      </section>

      <section aria-label="Indicateurs clés" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard titre="Abonnés actifs" valeur={kpis.abonnesActifs} sousValeur={`Objectif ${kpis.objectifAbonnes.toLocaleString('fr-TG')}`} icon={Users} href="/abonnes" couleur="bleu" />
        <KpiCard titre="Taux de recouvrement" valeur={kpis.tauxRecouvrement} unite="%" objectif={kpis.objectifRecouvrement} icon={CreditCard} href="/paiements" couleur={couleurRecouv} />
        <KpiCard titre="Taux de collecte" valeur={kpis.tauxCollecte} unite="%" objectif={kpis.objectifCollecte} icon={Route} href="/tournees" couleur={couleurCollecte} />
        <KpiCard titre="Engins opérationnels" valeur={`${kpis.enginsOperationnels}/${kpis.enginsTotal}`} sousValeur={kpis.enginsOperationnels === kpis.enginsTotal ? 'Flotte disponible' : `${kpis.enginsTotal - kpis.enginsOperationnels} hors service`} icon={Truck} href="/engins" couleur={couleurEngins} />
        <KpiCard titre="Encaissé ce mois" valeur={formatFCFA(kpis.encaisseMoisMontant)} sousValeur={`${kpis.encaisseMoisCount} paiements validés`} icon={TrendingUp} href="/paiements" couleur="vert" />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Conformité contractuelle">
        {progressItems.map(item => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-medium text-gray-500">{item.label}</span>
              <span className={cn('text-xs font-bold tabular-nums', item.value >= 100 ? 'text-emerald-700' : item.value >= 80 ? 'text-amber-700' : 'text-red-700')}>
                {Math.min(item.value, 999)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className={cn('h-full rounded-full transition-all', item.value >= 100 ? 'bg-emerald-600' : item.value >= 80 ? 'bg-amber-500' : 'bg-red-600')} style={{ width: `${Math.min(item.value, 100)}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2 md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recouvrement mensuel</h3>
              <p className="mt-1 text-[11px] text-gray-400">6 derniers mois · seuil contractuel {kpis.objectifRecouvrement}%</p>
            </div>
            <Link href="/paiements" className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
              Détails <ArrowRight size={13} />
            </Link>
          </div>
          <RecouvChart data={kpis.recouvrementParMois} objective={kpis.objectifRecouvrement} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Alertes actives</h3>
            {alertes.length > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">{alertes.length}</span>}
          </div>
          {alertes.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 size={20} /></span>
              <p className="mt-3 text-xs font-semibold text-gray-700">Situation nominale</p>
              <p className="mt-1 text-[11px] text-gray-400">Aucune alerte active à traiter.</p>
            </div>
          ) : (
            <div className="space-y-2">{alertes.map(alerte => <AlerteRow key={alerte.id} alerte={alerte} />)}</div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 md:px-5">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Paiements récents</h3>
            <p className="mt-0.5 text-[11px] text-gray-400">Derniers encaissements enregistrés</p>
          </div>
          <Link href="/paiements" className="text-xs font-semibold text-brand-700 hover:text-brand-800">Voir tout</Link>
        </div>
        {recentPaiements.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">Aucun paiement enregistré pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 md:px-5">Abonné</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Statut</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Mode</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400 md:px-5">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPaiements.map(paiement => (
                  <tr key={paiement.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900 md:px-5">{paiement.abonne ? `${paiement.abonne.prenom} ${paiement.abonne.nom}` : 'Non renseigné'}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Validé</span></td>
                    <td className="px-4 py-3"><span className={cn('rounded px-1.5 py-1 text-[10px] font-semibold', paiement.moyen === 'mobile-money' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600')}>{paiement.moyen === 'mobile-money' ? (paiement.operateur?.toUpperCase() ?? 'Mobile money') : 'Espèces'}</span></td>
                    <td className="px-4 py-3 text-[11px] text-gray-500">{formatDate(paiement.date)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-gray-900 md:px-5">{formatFCFA(paiement.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
