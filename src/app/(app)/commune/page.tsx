'use client'

import { useState, useEffect, useCallback } from 'react'
import { Landmark, Users, TrendingUp, Truck, MapPin, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { cn, formatDate, formatFCFA } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Profil {
  commune: string; telephone: string | null; adresse: string | null; region: string | null
  numContrat: string | null; dateContrat: string | null
  objectifAbonnes: number; objectifRecouvrement: number; objectifCollecte: number
}
interface Kpis {
  abonnesActifs: number; montantMoisCourant: number
  tauxRecouvrement: number; tauxCollecte: number
  tourneesTotal: number; tourneesTerminees: number
}
interface Zone { id: string; nom: string; frequenceCollecte: string; _count: { abonnes: number } }
interface Engin { id: string; immatriculation: string; type: string; statut: string }
interface TourneeRecente { id: string; date: string; statut: string; zone: { nom: string } }

const STATUT_ENGIN: Record<string, { label: string; cls: string }> = {
  'opérationnel':    { label: 'Opérationnel',  cls: 'bg-emerald-100 text-emerald-700' },
  'en-panne':        { label: 'En panne',      cls: 'bg-red-100 text-red-700' },
  'en-maintenance':  { label: 'Maintenance',   cls: 'bg-amber-100 text-amber-700' },
}

const STATUT_TOURNEE: Record<string, { label: string; cls: string }> = {
  planifiée:    { label: 'Planifiée',    cls: 'bg-gray-100 text-gray-600' },
  'en-cours':   { label: 'En cours',     cls: 'bg-blue-100 text-blue-700' },
  terminée:     { label: 'Terminée',     cls: 'bg-emerald-100 text-emerald-700' },
  annulée:      { label: 'Annulée',      cls: 'bg-red-100 text-red-600' },
}

export default function CommunePage() {
  const [org, setOrg] = useState<{ name: string; slug: string } | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [engins, setEngins] = useState<Engin[]>([])
  const [tournees, setTournees] = useState<TourneeRecente[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'synthese' | 'zones' | 'flotte' | 'activite'>('synthese')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api<{
        org: { name: string; slug: string }
        profil: Profil | null
        kpis: Kpis
        zones: Zone[]
        engins: Engin[]
        tourneesRecentes: TourneeRecente[]
      }>('/api/commune')
      setOrg(res.org)
      setProfil(res.profil)
      setKpis(res.kpis)
      setZones(res.zones)
      setEngins(res.engins)
      setTournees(res.tourneesRecentes)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const tabs = [
    { id: 'synthese',  label: 'Synthèse',     icon: TrendingUp },
    { id: 'zones',     label: 'Zones',        icon: MapPin },
    { id: 'flotte',    label: 'Flotte',       icon: Truck },
    { id: 'activite',  label: 'Activité',     icon: Eye },
  ] as const

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 animate-pulse h-12" />
        <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* En-tête DSP */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
          <Landmark size={18} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900">{org?.name ?? '—'}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Délégataire DSP · Commune {profil?.commune ?? '—'}
            {profil?.region && ` · ${profil.region}`}
          </div>
          {profil?.numContrat && (
            <div className="text-xs text-gray-400 mt-0.5">
              Contrat n° {profil.numContrat}
              {profil.dateContrat && ` · signé le ${formatDate(profil.dateContrat)}`}
            </div>
          )}
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">Vue mairie</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Synthèse */}
      {tab === 'synthese' && kpis && (
        <div className="space-y-4">
          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Abonnés actifs"
              value={kpis.abonnesActifs.toString()}
              sub={profil ? `obj. ${profil.objectifAbonnes}` : undefined}
              pct={profil ? Math.round(kpis.abonnesActifs / profil.objectifAbonnes * 100) : undefined}
              icon={<Users size={16} className="text-brand-600" />}
            />
            <KpiCard
              label="Encaissé (mois)"
              value={formatFCFA(kpis.montantMoisCourant)}
              icon={<TrendingUp size={16} className="text-emerald-600" />}
            />
            <KpiCard
              label="Taux recouvrement"
              value={`${kpis.tauxRecouvrement}%`}
              sub={profil ? `obj. ${profil.objectifRecouvrement}%` : undefined}
              pct={kpis.tauxRecouvrement}
              good={profil ? kpis.tauxRecouvrement >= profil.objectifRecouvrement : undefined}
            />
            <KpiCard
              label="Taux collecte (30j)"
              value={`${kpis.tauxCollecte}%`}
              sub={`${kpis.tourneesTerminees}/${kpis.tourneesTotal} tournées`}
              pct={kpis.tauxCollecte}
              good={profil ? kpis.tauxCollecte >= profil.objectifCollecte : undefined}
            />
          </div>

          {/* Barres objectifs */}
          {profil && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Objectifs contractuels</h3>
              <ProgressRow
                label="Abonnés"
                current={kpis.abonnesActifs}
                target={profil.objectifAbonnes}
                format={v => v.toString()}
              />
              <ProgressRow
                label="Recouvrement"
                current={kpis.tauxRecouvrement}
                target={profil.objectifRecouvrement}
                format={v => `${v}%`}
              />
              <ProgressRow
                label="Collecte"
                current={kpis.tauxCollecte}
                target={profil.objectifCollecte}
                format={v => `${v}%`}
              />
            </div>
          )}
        </div>
      )}

      {/* Zones */}
      {tab === 'zones' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{zones.length} zones de collecte</h3>
          </div>
          {zones.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">
              <MapPin size={28} className="mx-auto mb-2 text-gray-200" />
              Aucune zone configurée
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {zones.map(z => (
                <div key={z.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{z.nom}</div>
                    <div className="text-xs text-gray-500">
                      {z._count.abonnes} abonné(s) · {z.frequenceCollecte === 'bi-hebdomadaire' ? '2× par semaine' : '1× par semaine'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flotte */}
      {tab === 'flotte' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">{engins.length} engins</h3>
          </div>
          {engins.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">
              <Truck size={28} className="mx-auto mb-2 text-gray-200" />
              Aucun engin enregistré
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Immatriculation</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2 hidden sm:table-cell">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {engins.map(e => {
                  const s = STATUT_ENGIN[e.statut] ?? { label: e.statut, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{e.immatriculation}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 capitalize hidden sm:table-cell">{e.type}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', s.cls)}>{s.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Activité */}
      {tab === 'activite' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Tournées des 30 derniers jours</h3>
          </div>
          {tournees.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">Aucune tournée enregistrée</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Zone</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tournees.map(t => {
                  const s = STATUT_TOURNEE[t.statut] ?? { label: t.statut, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-2.5 text-sm text-gray-700">{formatDate(t.date)}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{t.zone.nom}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', s.cls)}>{s.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, pct, good, icon }: {
  label: string; value: string; sub?: string; pct?: number; good?: boolean; icon?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-1">
        <div className="text-xs text-gray-500">{label}</div>
        {icon}
      </div>
      <div className={cn('text-2xl font-bold', good === true ? 'text-emerald-600' : good === false ? 'text-red-600' : 'text-gray-900')}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      {pct !== undefined && (
        <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={cn('h-1.5 rounded-full', (good === true || good === undefined) ? 'bg-brand-500' : 'bg-red-400')}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function ProgressRow({ label, current, target, format }: {
  label: string; current: number; target: number; format: (v: number) => string
}) {
  const pct = target > 0 ? Math.min(Math.round(current / target * 100), 100) : 0
  const ok = current >= target
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className={cn('font-semibold', ok ? 'text-emerald-600' : 'text-gray-700')}>
          {format(current)} / {format(target)}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all', ok ? 'bg-emerald-500' : 'bg-brand-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
