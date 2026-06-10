'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Phone, Mail, MapPin, Plus, Search, Edit2, UserX } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { cn, formatFCFA } from '@/lib/utils'
import toast from 'react-hot-toast'

const POSTE_LABELS: Record<string, string> = {
  'chauffeur': 'Chauffeur',
  'agent-recouvrement': 'Agent recouvrement',
  'agent-collecte': 'Agent collecte',
  'superviseur': 'Superviseur',
  'comptable': 'Comptable',
  'technicien': 'Technicien',
  'autre': 'Autre',
}

const STATUT_COLORS: Record<string, string> = {
  'actif': 'bg-emerald-50 text-emerald-700',
  'inactif': 'bg-gray-100 text-gray-500',
  'congé': 'bg-blue-50 text-blue-700',
  'suspendu': 'bg-red-50 text-red-600',
}

type Employe = {
  id: string
  nom: string
  prenom: string
  telephone: string
  email?: string | null
  poste: string
  statut: string
  dateEmbauche?: string | null
  salaire?: number | null
  notes?: string | null
  zone?: { id: string; nom: string } | null
}

type Stats = {
  total: number
  actifs: number
  inactifs: number
  conge: number
  suspendus: number
  masseSalariale: number
}

type Zone = { id: string; nom: string }

const EMPTY_FORM = {
  prenom: '', nom: '', telephone: '', email: '',
  poste: 'agent-collecte', statut: 'actif',
  dateEmbauche: '', salaire: '', zoneId: '', notes: '',
}

export default function EmployesPage() {
  const [employes, setEmployes] = useState<Employe[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, actifs: 0, inactifs: 0, conge: 0, suspendus: 0, masseSalariale: 0 })
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterPoste, setFilterPoste] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employe | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [empRes, zoneRes] = await Promise.all([
        api<{ employes: Employe[]; stats: Stats }>('/api/employes'),
        api<{ zones: Zone[] }>('/api/zones'),
      ])
      setEmployes(empRes.employes)
      setStats(empRes.stats)
      setZones(zoneRes.zones)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = employes.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${e.prenom} ${e.nom} ${e.telephone} ${e.poste}`.toLowerCase().includes(q)
    const matchStatut = !filterStatut || e.statut === filterStatut
    const matchPoste = !filterPoste || e.poste === filterPoste
    return matchSearch && matchStatut && matchPoste
  })

  const openEdit = (e: Employe) => {
    setEditTarget(e)
    setForm({
      prenom: e.prenom, nom: e.nom, telephone: e.telephone,
      email: e.email ?? '', poste: e.poste, statut: e.statut,
      dateEmbauche: e.dateEmbauche ? e.dateEmbauche.split('T')[0] : '',
      salaire: e.salaire?.toString() ?? '',
      zoneId: e.zone?.id ?? '',
      notes: e.notes ?? '',
    })
  }

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setAddOpen(true)
  }

  const handleSave = async () => {
    if (!form.prenom || !form.nom || !form.telephone) {
      toast.error('Prénom, nom et téléphone requis')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        salaire: form.salaire ? parseInt(form.salaire) : undefined,
        email: form.email || undefined,
        zoneId: form.zoneId || undefined,
        dateEmbauche: form.dateEmbauche || undefined,
        notes: form.notes || undefined,
      }

      if (editTarget) {
        await api(`/api/employes/${editTarget.id}`, { method: 'PATCH', body: payload })
        toast.success('Employé mis à jour')
        setEditTarget(null)
      } else {
        await api('/api/employes', { method: 'POST', body: payload })
        toast.success(`${form.prenom} ${form.nom} ajouté(e)`)
        setAddOpen(false)
      }
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (e: Employe) => {
    if (!confirm(`Désactiver ${e.prenom} ${e.nom} ?`)) return
    try {
      await api(`/api/employes/${e.id}`, { method: 'DELETE' })
      toast.success('Employé désactivé')
      load()
    } catch {
      toast.error('Erreur')
    }
  }

  const modalOpen = addOpen || editTarget !== null

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total effectif', val: stats.total, color: 'text-gray-900' },
          { label: 'Actifs', val: stats.actifs, color: 'text-emerald-600' },
          { label: 'En congé', val: stats.conge, color: 'text-blue-600' },
          { label: 'Masse salariale / mois', val: formatFCFA(stats.masseSalariale), color: 'text-amber-600', isText: true },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
            <div className={cn('text-2xl font-bold tabular-nums', s.color)}>{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Rechercher un employé…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
          >
            <option value="">Tous statuts</option>
            <option value="actif">Actif</option>
            <option value="congé">En congé</option>
            <option value="suspendu">Suspendu</option>
            <option value="inactif">Inactif</option>
          </select>
          <select
            className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
            value={filterPoste}
            onChange={e => setFilterPoste(e.target.value)}
          >
            <option value="">Tous postes</option>
            {Object.entries(POSTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <Button size="sm" variant="primary" onClick={openAdd}>
          <Plus size={13} /> Nouvel employé
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">{filtered.length} employé(s)</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {employes.length === 0 ? 'Aucun employé enregistré' : 'Aucun résultat'}
            </p>
          </div>
        ) : (
          <table className="w-full table-dense">
            <thead>
              <tr>
                <th className="text-left">Employé</th>
                <th className="text-left">Poste</th>
                <th className="text-left hidden md:table-cell">Contact</th>
                <th className="text-left hidden lg:table-cell">Zone</th>
                <th className="text-right hidden sm:table-cell">Salaire</th>
                <th className="text-left">Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 flex-shrink-0">
                        {e.prenom[0]}{e.nom[0]}
                      </div>
                      <span className="font-medium text-sm text-gray-900">{e.prenom} {e.nom}</span>
                    </div>
                  </td>
                  <td className="text-xs text-gray-600">{POSTE_LABELS[e.poste] ?? e.poste}</td>
                  <td className="hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-600 flex items-center gap-1"><Phone size={10} />{e.telephone}</span>
                      {e.email && <span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{e.email}</span>}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell text-xs text-gray-500">
                    {e.zone ? (
                      <span className="flex items-center gap-1"><MapPin size={10} />{e.zone.nom}</span>
                    ) : '—'}
                  </td>
                  <td className="hidden sm:table-cell text-right text-xs font-mono text-gray-700">
                    {e.salaire ? formatFCFA(e.salaire) : '—'}
                  </td>
                  <td>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUT_COLORS[e.statut] ?? 'bg-gray-100 text-gray-500')}>
                      {e.statut}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(e)}>
                        <Edit2 size={13} />
                      </Button>
                      {e.statut !== 'inactif' && (
                        <Button size="sm" variant="ghost" onClick={() => handleDeactivate(e)}>
                          <UserX size={13} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal add/edit */}
      <Modal
        open={modalOpen}
        onClose={() => { setAddOpen(false); setEditTarget(null) }}
        title={editTarget ? `Modifier — ${editTarget.prenom} ${editTarget.nom}` : 'Nouvel employé'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAddOpen(false); setEditTarget(null) }}>Annuler</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" required value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
          <Input label="Nom" required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
          <Input label="Téléphone" required value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Select label="Poste" value={form.poste} onChange={e => setForm(f => ({ ...f, poste: e.target.value }))}>
            {Object.entries(POSTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Statut" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
            <option value="actif">Actif</option>
            <option value="congé">En congé</option>
            <option value="suspendu">Suspendu</option>
            <option value="inactif">Inactif</option>
          </Select>
          <Select label="Zone assignée" value={form.zoneId} onChange={e => setForm(f => ({ ...f, zoneId: e.target.value }))}>
            <option value="">— Aucune zone —</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </Select>
          <Input label="Date d'embauche" type="date" value={form.dateEmbauche} onChange={e => setForm(f => ({ ...f, dateEmbauche: e.target.value }))} />
          <Input label="Salaire mensuel (FCFA)" type="number" value={form.salaire} onChange={e => setForm(f => ({ ...f, salaire: e.target.value }))} className="col-span-2" />
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Informations complémentaires…"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
