'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Truck, AlertTriangle, Fuel, Wrench } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { BadgeEngin } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { cn, formatDate } from '@/lib/utils'
import { TYPE_ENGIN_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface Engin {
  id: string; immatriculation: string; type: string; marque: string | null
  modele: string | null; annee: number | null; statut: string
  kilometrage: number; dateAcquisition: string | null; createdAt: string
}

export default function EnginsPage() {
  const router = useRouter()
  const [engins, setEngins] = useState<Engin[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [panneOpen, setPanneOpen] = useState<string | null>(null)
  const [panneDesc, setPanneDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    immatriculation: '', type: 'tricycle', marque: '', modele: '',
    annee: new Date().getFullYear(), kilometrage: 0, dateAcquisition: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api<{ engins: Engin[] }>('/api/engins')
      setEngins(res.engins ?? [])
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.immatriculation || !form.marque) { toast.error('Remplissez les champs requis'); return }
    setSaving(true)
    try {
      await api('/api/engins', { method: 'POST', body: { ...form, statut: 'opérationnel' } })
      toast.success(`Engin ${form.immatriculation} créé`)
      setAddOpen(false)
      setForm({ immatriculation: '', type: 'tricycle', marque: '', modele: '', annee: new Date().getFullYear(), kilometrage: 0, dateAcquisition: '' })
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handlePanne = async () => {
    if (!panneOpen || !panneDesc) { toast.error('Décrivez la panne'); return }
    setSaving(true)
    try {
      await api(`/api/engins/${panneOpen}`, {
        method: 'PATCH',
        body: { action: 'panne', description: panneDesc, date: new Date().toISOString().split('T')[0] },
      })
      toast.success('Panne signalée — statut mis à jour')
      setPanneOpen(null)
      setPanneDesc('')
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    total: engins.length,
    op: engins.filter(e => e.statut === 'opérationnel').length,
    panne: engins.filter(e => e.statut === 'en-panne').length,
    maint: engins.filter(e => e.statut === 'en-maintenance').length,
  }

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: k === 'annee' || k === 'kilometrage' ? Number(e.target.value) : e.target.value }))

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total engins', val: stats.total, color: 'text-gray-900' },
          { label: 'Opérationnels', val: stats.op, color: 'text-emerald-600' },
          { label: 'En panne', val: stats.panne, color: 'text-red-600' },
          { label: 'En maintenance', val: stats.maint, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <div className={cn('text-2xl font-bold', s.color)}>{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Flotte de {stats.total} engins</h3>
        <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}><Plus size={13} /> Nouvel engin</Button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {engins.map(engin => {
            const isPanne = engin.statut === 'en-panne'
            return (
              <div key={engin.id} className={cn('bg-white border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow', isPanne ? 'border-red-200' : 'border-gray-200')}
                onClick={() => router.push(`/engins/${engin.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{engin.immatriculation}</div>
                    <div className="text-xs text-gray-500">{TYPE_ENGIN_LABELS[engin.type as keyof typeof TYPE_ENGIN_LABELS] ?? engin.type}</div>
                  </div>
                  <BadgeEngin statut={engin.statut as Parameters<typeof BadgeEngin>[0]['statut']} />
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  {engin.marque && <div className="flex items-center gap-1.5"><Truck size={11} />{engin.marque} {engin.modele ?? ''} {engin.annee ?? ''}</div>}
                  <div className="flex items-center gap-1.5"><Fuel size={11} />{engin.kilometrage.toLocaleString()} km</div>
                  {engin.dateAcquisition && <div className="flex items-center gap-1.5"><Wrench size={11} />Acquis le {formatDate(engin.dateAcquisition)}</div>}
                </div>
                {isPanne && (
                  <div className="mt-3 pt-3 border-t border-red-100">
                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><AlertTriangle size={11} /> En panne</span>
                  </div>
                )}
                {engin.statut === 'opérationnel' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Button size="sm" variant="ghost" className="w-full text-red-600 hover:bg-red-50"
                      onClick={e => { e.stopPropagation(); setPanneOpen(engin.id) }}>
                      <AlertTriangle size={11} /> Signaler une panne
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
          {engins.length === 0 && !loading && (
            <div className="col-span-3 text-center py-12 text-gray-400 text-sm">Aucun engin enregistré.</div>
          )}
        </div>
      )}

      {/* Modal nouvel engin */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nouvel engin" size="md"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Annuler</Button><Button variant="primary" loading={saving} onClick={handleCreate}>Créer</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Immatriculation *" value={form.immatriculation} onChange={setF('immatriculation')} placeholder="TG-1234-LO" className="col-span-2" />
          <Select label="Type *" value={form.type} onChange={setF('type')}>
            {Object.entries(TYPE_ENGIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Marque *" value={form.marque} onChange={setF('marque')} placeholder="Piaggio" />
          <Input label="Modèle" value={form.modele} onChange={setF('modele')} placeholder="Ape TM" />
          <Input label="Année" type="number" value={form.annee} onChange={setF('annee')} min="2000" />
          <Input label="Kilométrage" type="number" value={form.kilometrage} onChange={setF('kilometrage')} min="0" className="col-span-2" />
          <Input label="Date d'acquisition" type="date" value={form.dateAcquisition} onChange={setF('dateAcquisition')} className="col-span-2" />
        </div>
      </Modal>

      {/* Modal panne */}
      <Modal open={!!panneOpen} onClose={() => { setPanneOpen(null); setPanneDesc('') }} title="Signaler une panne" size="sm"
        footer={<><Button variant="secondary" onClick={() => { setPanneOpen(null); setPanneDesc('') }}>Annuler</Button><Button variant="danger" loading={saving} onClick={handlePanne}>Signaler</Button></>}>
        <Input label="Description de la panne" value={panneDesc} onChange={e => setPanneDesc(e.target.value)} placeholder="Moteur ne démarre pas, pneu crevé…" required />
      </Modal>
    </div>
  )
}
