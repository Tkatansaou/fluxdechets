'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2, Users, CreditCard, Landmark, Search,
  TrendingUp, ShieldAlert, ChevronRight, CheckCircle2,
  XCircle, AlertTriangle, UserCog, RefreshCw, ArrowUpRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useUser } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { cn, formatFCFA, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

type PlatformStats = {
  totalOrgs: number
  delegataires: number
  mairies: number
  newOrgsThisMonth: number
  totalUsers: number
  totalAbonnes: number
  paiementsMois: { montant: number; count: number }
  evolutionPaiements: number | null
  signupParMois: { mois: string; count: number }[]
}

type OrgRow = {
  id: string
  name: string
  slug: string
  typeOrg: string
  createdAt: string
  commune: string
  region: string | null
  ownerEmail: string
  ownerName: string | null
  ownerStatus: string
  membresCount: number
  abonnesActifs: number
  paiementsMois: { montant: number; count: number }
}

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  createdAt: string
  emailVerified: boolean
  org: { id: string; name: string; typeOrg: string } | null
  orgRole: string | null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple'
}) {
  const c = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }[color]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', c)}>
        <Icon size={16} />
      </div>
      <div className="text-2xl font-bold tabular-nums text-gray-900">
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </div>
      <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={10} /> Actif
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle size={10} /> Suspendu
    </span>
  )
}

function OrgTypeBadge({ typeOrg }: { typeOrg: string }) {
  if (typeOrg === 'mairie') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
      <Landmark size={9} /> Mairie
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
      <Building2 size={9} /> DSP
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    SUPERADMIN: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-indigo-50 text-indigo-700',
    USER: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', styles[role] ?? 'bg-gray-100 text-gray-600')}>
      {role}
    </span>
  )
}

// Mini bar chart for signups
function SignupChart({ data }: { data: { mois: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map(d => (
        <div key={d.mois} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-indigo-400 rounded-t-sm"
            style={{ height: `${Math.round((d.count / max) * 56)}px`, minHeight: '4px' }}
          />
          <span className="text-[9px] text-gray-400">{d.mois.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const user = useUser()
  const router = useRouter()

  const [tab, setTab] = useState<'overview' | 'orgs' | 'users'>('overview')
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [orgSearch, setOrgSearch] = useState('')
  const [orgTypeFilter, setOrgTypeFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')

  // Guard: only SUPERADMIN
  useEffect(() => {
    if (user && user.role !== 'SUPERADMIN') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const res = await api<{ stats: PlatformStats }>('/api/superadmin/stats')
      setStats(res.stats)
    } catch {
      toast.error('Erreur chargement stats')
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadOrgs = useCallback(async () => {
    setLoadingOrgs(true)
    try {
      const params = new URLSearchParams()
      if (orgSearch) params.set('q', orgSearch)
      if (orgTypeFilter) params.set('type', orgTypeFilter)
      const res = await api<{ orgs: OrgRow[] }>(`/api/superadmin/orgs?${params}`)
      setOrgs(res.orgs)
    } catch {
      toast.error('Erreur chargement organisations')
    } finally {
      setLoadingOrgs(false)
    }
  }, [orgSearch, orgTypeFilter])

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const params = new URLSearchParams()
      if (userSearch) params.set('q', userSearch)
      if (userRoleFilter) params.set('role', userRoleFilter)
      const res = await api<{ users: UserRow[] }>(`/api/superadmin/users?${params}`)
      setUsers(res.users)
    } catch {
      toast.error('Erreur chargement utilisateurs')
    } finally {
      setLoadingUsers(false)
    }
  }, [userSearch, userRoleFilter])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { if (tab === 'orgs') loadOrgs() }, [tab, loadOrgs])
  useEffect(() => { if (tab === 'users') loadUsers() }, [tab, loadUsers])

  // Actions on orgs
  const handleOrgAction = async (orgId: string, action: string) => {
    try {
      await api(`/api/superadmin/orgs/${orgId}`, { method: 'PATCH', body: { action } })
      toast.success('Action effectuée')
      loadOrgs()
      loadStats()
    } catch {
      toast.error('Erreur')
    }
  }

  // Actions on users
  const handleUserAction = async (userId: string, data: { status?: string; role?: string }) => {
    try {
      await api(`/api/superadmin/users/${userId}`, { method: 'PATCH', body: data })
      toast.success('Utilisateur mis à jour')
      loadUsers()
    } catch {
      toast.error('Erreur')
    }
  }

  if (!user || user.role !== 'SUPERADMIN') return null

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center">
              <ShieldAlert size={13} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Administration plateforme</h1>
          </div>
          <p className="text-xs text-gray-400">Vue globale fluxdechets.com — toutes organisations confondues</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { loadStats(); if (tab === 'orgs') loadOrgs(); if (tab === 'users') loadUsers() }}>
          <RefreshCw size={13} /> Actualiser
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { id: 'overview', label: 'Vue d\'ensemble' },
          { id: 'orgs', label: 'Organisations' },
          { id: 'users', label: 'Utilisateurs' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Vue d'ensemble ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {loadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-4 animate-pulse h-24" />
              ))}
            </div>
          ) : stats ? (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatCard
                  label="Organisations"
                  value={stats.totalOrgs}
                  sub={`${stats.newOrgsThisMonth} ce mois`}
                  icon={Building2}
                  color="indigo"
                />
                <StatCard
                  label="Délégataires DSP"
                  value={stats.delegataires}
                  icon={Building2}
                  color="emerald"
                />
                <StatCard
                  label="Mairies"
                  value={stats.mairies}
                  icon={Landmark}
                  color="blue"
                />
                <StatCard
                  label="Abonnés actifs"
                  value={stats.totalAbonnes}
                  sub="toutes orgs"
                  icon={Users}
                  color="purple"
                />
                <StatCard
                  label="Paiements ce mois"
                  value={formatFCFA(stats.paiementsMois.montant)}
                  sub={`${stats.paiementsMois.count} transactions${stats.evolutionPaiements !== null ? ` · ${stats.evolutionPaiements > 0 ? '+' : ''}${stats.evolutionPaiements}% vs mois préc.` : ''}`}
                  icon={CreditCard}
                  color="amber"
                />
              </div>

              {/* Signup chart + summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Inscriptions par mois</h3>
                      <p className="text-xs text-gray-400">6 derniers mois</p>
                    </div>
                    <TrendingUp size={16} className="text-indigo-400" />
                  </div>
                  {stats.signupParMois.length > 0 ? (
                    <SignupChart data={stats.signupParMois} />
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-6">Aucune donnée</div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Répartition</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Entreprises DSP', count: stats.delegataires, total: stats.totalOrgs, color: 'bg-emerald-500' },
                      { label: 'Mairies', count: stats.mairies, total: stats.totalOrgs, color: 'bg-blue-500' },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-semibold text-gray-900">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={cn('h-1.5 rounded-full', item.color)}
                            style={{ width: item.total > 0 ? `${Math.round((item.count / item.total) * 100)}%` : '0%' }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Utilisateurs totaux</span>
                        <span className="font-bold text-gray-900">{stats.totalUsers}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Tab: Organisations ── */}
      {tab === 'orgs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Rechercher…"
                value={orgSearch}
                onChange={e => setOrgSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadOrgs()}
              />
            </div>
            <select
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={orgTypeFilter}
              onChange={e => { setOrgTypeFilter(e.target.value) }}
            >
              <option value="">Tous types</option>
              <option value="delegataire">DSP uniquement</option>
              <option value="mairie">Mairies uniquement</option>
            </select>
            <Button size="sm" variant="secondary" onClick={loadOrgs}>
              <Search size={12} /> Filtrer
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">{orgs.length} organisation(s)</span>
            </div>
            {loadingOrgs ? (
              <div className="text-center py-12 text-sm text-gray-400">Chargement…</div>
            ) : orgs.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">Aucune organisation</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Organisation</th>
                      <th className="text-left">Commune</th>
                      <th className="text-left hidden md:table-cell">Propriétaire</th>
                      <th className="text-right hidden sm:table-cell">Abonnés</th>
                      <th className="text-right hidden lg:table-cell">Paiements mois</th>
                      <th className="text-left hidden sm:table-cell">Statut</th>
                      <th className="text-left hidden sm:table-cell">Inscrit le</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map(org => (
                      <tr key={org.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                              {org.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-gray-900 leading-tight">{org.name}</div>
                              <OrgTypeBadge typeOrg={org.typeOrg} />
                            </div>
                          </div>
                        </td>
                        <td className="text-xs text-gray-600">
                          {org.commune}
                          {org.region && <div className="text-gray-400">{org.region}</div>}
                        </td>
                        <td className="hidden md:table-cell text-xs text-gray-600">
                          <div>{org.ownerName ?? '—'}</div>
                          <div className="text-gray-400">{org.ownerEmail}</div>
                        </td>
                        <td className="hidden sm:table-cell text-right text-sm font-mono font-medium text-gray-800">
                          {org.abonnesActifs}
                        </td>
                        <td className="hidden lg:table-cell text-right text-xs font-mono text-gray-600">
                          {org.paiementsMois.montant > 0 ? formatFCFA(org.paiementsMois.montant) : '—'}
                        </td>
                        <td className="hidden sm:table-cell">
                          <StatusBadge status={org.ownerStatus} />
                        </td>
                        <td className="hidden sm:table-cell text-xs text-gray-400">
                          {formatDate(org.createdAt)}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            {org.ownerStatus === 'ACTIVE' ? (
                              <button
                                onClick={() => {
                                  if (confirm(`Suspendre l'accès de "${org.name}" ?`)) {
                                    handleOrgAction(org.id, 'suspend-owner')
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                              >
                                Suspendre
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOrgAction(org.id, 'activate-owner')}
                                className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                              >
                                Réactiver
                              </button>
                            )}
                            <a
                              href={`https://fluxdechets.com/commune?org=${org.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <ArrowUpRight size={13} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Utilisateurs ── */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Email ou nom…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadUsers()}
              />
            </div>
            <select
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={userRoleFilter}
              onChange={e => { setUserRoleFilter(e.target.value) }}
            >
              <option value="">Tous rôles</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
            <Button size="sm" variant="secondary" onClick={loadUsers}>
              <Search size={12} /> Filtrer
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">{users.length} utilisateur(s)</span>
            </div>
            {loadingUsers ? (
              <div className="text-center py-12 text-sm text-gray-400">Chargement…</div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">Aucun utilisateur</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Utilisateur</th>
                      <th className="text-left hidden md:table-cell">Organisation</th>
                      <th className="text-left">Rôle</th>
                      <th className="text-left hidden sm:table-cell">Statut</th>
                      <th className="text-left hidden lg:table-cell">Inscrit le</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                              {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-gray-900 leading-tight">{u.name ?? '—'}</div>
                              <div className="text-xs text-gray-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell text-xs text-gray-600">
                          {u.org ? (
                            <div className="flex items-center gap-1.5">
                              <OrgTypeBadge typeOrg={u.org.typeOrg} />
                              <span className="truncate max-w-[120px]">{u.org.name}</span>
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td>
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="hidden sm:table-cell">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="hidden lg:table-cell text-xs text-gray-400">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            {/* Role selector */}
                            {u.role !== 'SUPERADMIN' && (
                              <select
                                className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none"
                                value={u.role}
                                onChange={e => handleUserAction(u.id, { role: e.target.value })}
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            )}
                            {/* Suspend / activate */}
                            {u.role !== 'SUPERADMIN' && (
                              u.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => {
                                    if (confirm(`Suspendre ${u.email} ?`)) {
                                      handleUserAction(u.id, { status: 'SUSPENDED' })
                                    }
                                  }}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Suspendre"
                                >
                                  <AlertTriangle size={13} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(u.id, { status: 'ACTIVE' })}
                                  className="p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                  title="Réactiver"
                                >
                                  <UserCog size={13} />
                                </button>
                              )
                            )}
                            {u.role === 'SUPERADMIN' && (
                              <span className="text-xs text-purple-500 font-medium flex items-center gap-1">
                                <ChevronRight size={10} /> Vous
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
