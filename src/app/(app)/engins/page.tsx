'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Truck, AlertTriangle, Fuel, Wrench } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { BadgeEngin } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { cn, formatDate, formatFCFA } from '@/lib/utils'
import { TYPE_ENGIN_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { TypeEngin } from '@/types'

export default function EnginsPage() {
  const router = useRouter()
  const { state, addEngin, addPanne } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [panneOpen, setPanneOpen] = useState<string | null>(null)
  const [panneDesc, setPanneDesc] = useState('')
  const [form, setForm] = useState({
    immatriculation: '', type: 'tricycle' as TypeEngin,
    marque: '', modele: '', annee: new Date().getFullYear(),
    kilometrage: 0, date_acquisition: '',
  })

  const handleCreate = () => {
    if (!form.immatriculation || !form.marque) { toast.error('Remplissez les champs requis'); return }
    addEngin({ ...form, statut: 'opérationnel' })
    toast.success(`Engin ${form.immatriculation} créé`)
    setAddOpen(false)
    setForm({ immatriculation: '', type: 'tricycle', marque: '', modele: '', annee: new Date().getFullYear(), kilometrage: 0, date_acquisition: '' })
  }

  const handlePanne = () => {
    if (!panneOpen || !panneDesc) { toast.error('Décrivez la panne'); return }
    addPanne({ engin_id: panneOpen, description: panneDesc, date: new Date().toISOString().split('T')[0], statut: 'ouverte' })
    toast.success('Panne signalée — statut mis à jour')
    setPanneOpen(null)
    setPanneDesc('')
  }

  const stats = {
    total: state.engins.length,
    op: state.engins.filter(e => e.statut === 'opérationnel').length,
    panne: state.engins.filter(e => e.statut === 'en-panne').length,
    maint: state.engins.filter(e => e.statut === 'en-maintenance').length,
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total engins', val: stats.total, color: 'text-gray-900' },
          { label: 'Opérationnels', val: stats.op, color: 'text-emerald-600' },
          { label: 'En panne', val: stats.panne, color: 'text-red-600' },
          { label: 'En maintenance', val: stats.maint, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
            <div className={cn('text-2xl font-bold tabular-nums', s.color)}>{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Flotte de {stats.total} engins</h3>
        <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
          <Plus size={13} /> Nouvel engin
        </Button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.engins.map(engin => {
          const maintenances = state.maintenances.filter(m => m.engin_id === engin.id)
          const pannesOuv = state.pannes.filter(p => p.engin_id === engin.id && (p.statut === 'ouverte' || p.statut === 'en-cours'))
          const dernierePlein = state.carburants.filter(c => c.engin_id === engin.id).sort((a, b) => b.date.localeCompare(a.date))[0]
          const derniereMaint = maintenances.sort((a, b) => b.date.localeCompare(a.date))[0]

          return (
            <div
              key={engin.id}
              className={cn(
                'bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow',
                engin.statut === 'en-panne' ? 'border-red-300 bg-red-50/30' :
                  engin.statut === 'en-maintenance' ? 'border-amber-300 bg-amber-50/30' :
                    'border-gray-200',
              )}
              onClick={() => router.push(`/engins/${engin.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    engin.type === 'camion-benne' ? 'bg-gray-100' : 'bg-brand-50',
                  )}>
                    <Truck size={18} className={engin.type === 'camion-benne' ? 'text-gray-600' : 'text-brand-600'} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{engin.immatriculation}</div>
                    <div className="text-xs text-gray-500">{engin.marque} {engin.modele}</div>
                  </div>
                </div>
                <BadgeEngin statut={engin.statut} />
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-gray-50 rounded-md px-2.5 py-2">
                  <div className="text-gray-500 mb-0.5">Type</div>
                  <div className="font-medium text-gray-700">{TYPE_ENGIN_LABELS[engin.type]}</div>
                </div>
                <div className="bg-gray-50 rounded-md px-2.5 py-2">
                  <div className="text-gray-500 mb-0.5">Kilométrage</div>
                  <div className="font-bold text-gray-900">{engin.kilometrage.toLocaleString()} km</div>
                </div>
                <div className="bg-gray-50 rounded-md px-2.5 py-2">
                  <div className="text-gray-500 mb-0.5">Année</div>
                  <div className="font-medium text-gray-700">{engin.annee}</div>
                </div>
                <div className="bg-gray-50 rounded-md px-2.5 py-2">
                  <div className="text-gray-500 mb-0.5">Acquisition</div>
                  <div className="font-medium text-gray-700">{formatDate(engin.date_acquisition)}</div>
                </div>
              </div>

              {/* Last events */}
              {derniereMaint && (
                <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 pt-2">
                  <Wrench size={11} />
                  <span>Entretien : {derniereMaint.type} le {formatDate(derniereMaint.date)}</span>
                </div>
              )}

              {pannesOuv.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-red-600 mt-1">
                  <AlertTriangle size={11} />
                  <span className="font-medium">{pannesOuv[0].description}</span>
                </div>
              )}

              {/* Actions */}
              {engin.statut === 'opérationnel' && (
                <button
                  onClick={e => { e.stopPropagation(); setPanneOpen(engin.id) }}
                  className="mt-3 w-full text-xs text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 rounded-lg py-1.5 transition-colors"
                >
                  Signaler une panne
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal créer engin */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter un engin"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleCreate}>Créer</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Immatriculation" required value={form.immatriculation} onChange={e => setForm(f => ({ ...f, immatriculation: e.target.value }))} placeholder="TRI-003" />
          <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TypeEngin }))}>
            {Object.entries(TYPE_ENGIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Marque" required value={form.marque} onChange={e => setForm(f => ({ ...f, marque: e.target.value }))} placeholder="Yamaha" />
          <Input label="Modèle" value={form.modele} onChange={e => setForm(f => ({ ...f, modele: e.target.value }))} placeholder="Alpha 110" />
          <Input label="Année" type="number" value={form.annee} onChange={e => setForm(f => ({ ...f, annee: parseInt(e.target.value) }))} min="2000" max="2030" />
          <Input label="Kilométrage initial" type="number" value={form.kilometrage} onChange={e => setForm(f => ({ ...f, kilometrage: parseInt(e.target.value) }))} min="0" />
          <Input label="Date d'acquisition" type="date" value={form.date_acquisition} onChange={e => setForm(f => ({ ...f, date_acquisition: e.target.value }))} className="col-span-2" />
        </div>
      </Modal>

      {/* Modal panne */}
      <Modal
        open={!!panneOpen}
        onClose={() => setPanneOpen(null)}
        title={`Signaler une panne — ${state.engins.find(e => e.id === panneOpen)?.immatriculation ?? ''}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPanneOpen(null)}>Annuler</Button>
            <Button variant="danger" onClick={handlePanne}>Signaler la panne</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            L'engin sera mis en statut <strong>En panne</strong> et une alerte apparaîtra sur le tableau de bord.
          </p>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Description de la panne *</label>
            <textarea
              value={panneDesc}
              onChange={e => setPanneDesc(e.target.value)}
              placeholder="Ex : Moteur qui surchauffe, fumée noire au démarrage…"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 h-24 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
