'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Wrench, Fuel, AlertTriangle, CheckCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { BadgeEngin } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { cn, formatDate, formatFCFA } from '@/lib/utils'
import { TYPE_ENGIN_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { TypeMaintenance } from '@/types'

export default function FicheEnginPage() {
  const { id } = useParams()
  const router = useRouter()
  const { state, addMaintenance, addCarburant, addPanne, updatePanne, updateEngin } = useApp()
  const [maintOpen, setMaintOpen] = useState(false)
  const [carburantOpen, setCarburantOpen] = useState(false)
  const [panneOpen, setPanneOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const engin = state.engins.find(e => e.id === id)
  if (!engin) {
    return (
      <div className="text-center py-20 text-gray-500">
        Engin introuvable.
        <button className="block mx-auto mt-3 text-brand-600 text-sm" onClick={() => router.push('/engins')}>← Retour</button>
      </div>
    )
  }

  const maintenances = state.maintenances.filter(m => m.engin_id === id).sort((a, b) => b.date.localeCompare(a.date))
  const carburants = state.carburants.filter(c => c.engin_id === id).sort((a, b) => b.date.localeCompare(a.date))
  const pannes = state.pannes.filter(p => p.engin_id === id).sort((a, b) => b.date.localeCompare(a.date))
  const pannesActives = pannes.filter(p => p.statut === 'ouverte' || p.statut === 'en-cours')

  // Consommation moyenne carburant
  const consoMoy = carburants.length >= 2
    ? (() => {
        const sorted = [...carburants].sort((a, b) => a.kilometrage - b.kilometrage)
        const kmDelta = sorted[sorted.length - 1].kilometrage - sorted[0].kilometrage
        const litres = sorted.slice(1).reduce((s, c) => s + c.litres, 0)
        return kmDelta > 0 ? ((litres / kmDelta) * 100).toFixed(1) : null
      })()
    : null

  const [maintForm, setMaintForm] = useState({ type: 'vidange' as TypeMaintenance, description: '', cout: '', prestataire: '', kilometrage_lors: String(engin.kilometrage), date: new Date().toISOString().split('T')[0] })
  const [carburantForm, setCarburantForm] = useState({ litres: '', cout: '', kilometrage: String(engin.kilometrage), date: new Date().toISOString().split('T')[0] })
  const [panneDesc, setPanneDesc] = useState('')

  const handleMaint = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    addMaintenance({ engin_id: id as string, ...maintForm, cout: parseInt(maintForm.cout) || 0, kilometrage_lors: parseInt(maintForm.kilometrage_lors) || engin.kilometrage })
    updateEngin(id as string, { statut: 'opérationnel' })
    toast.success('Entretien enregistré')
    setMaintOpen(false)
    setLoading(false)
  }

  const handleCarburant = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    addCarburant({ engin_id: id as string, litres: parseFloat(carburantForm.litres), cout: parseInt(carburantForm.cout) || 0, kilometrage: parseInt(carburantForm.kilometrage) || engin.kilometrage, date: carburantForm.date, agent_id: 'user-1' })
    toast.success('Plein enregistré')
    setCarburantOpen(false)
    setLoading(false)
  }

  const handlePanne = async () => {
    if (!panneDesc) { toast.error('Décrivez la panne'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    addPanne({ engin_id: id as string, description: panneDesc, date: new Date().toISOString().split('T')[0], statut: 'ouverte' })
    toast.success('Panne signalée')
    setPanneOpen(false)
    setPanneDesc('')
    setLoading(false)
  }

  const handleResoudre = (panneId: string) => {
    if (confirm('Marquer cette panne comme résolue ?')) {
      updatePanne(panneId, { statut: 'résolue', date_resolution: new Date().toISOString().split('T')[0] })
      toast.success('Panne résolue')
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 mt-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{engin.immatriculation}</h2>
            <BadgeEngin statut={engin.statut} />
          </div>
          <p className="text-sm text-gray-500">{engin.marque} {engin.modele} · {engin.annee} · {TYPE_ENGIN_LABELS[engin.type]}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="sm" variant="secondary" onClick={() => setCarburantOpen(true)}>
            <Fuel size={13} /> Carburant
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setMaintOpen(true)}>
            <Wrench size={13} /> Entretien
          </Button>
          {engin.statut === 'opérationnel' && (
            <Button size="sm" variant="danger" onClick={() => setPanneOpen(true)}>
              <AlertTriangle size={13} /> Panne
            </Button>
          )}
        </div>
      </div>

      {/* Pannes actives */}
      {pannesActives.map(p => (
        <div key={p.id} className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-red-800">Panne active depuis le {formatDate(p.date)}</div>
              <div className="text-sm text-red-700 mt-0.5">{p.description}</div>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => handleResoudre(p.id)}>
            <CheckCircle size={13} className="text-emerald-600" /> Résolue
          </Button>
        </div>
      ))}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Kilométrage actuel</div>
          <div className="text-xl font-bold text-gray-900">{engin.kilometrage.toLocaleString()} km</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Nombre d'entretiens</div>
          <div className="text-xl font-bold text-gray-900">{maintenances.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Conso. moy. carburant</div>
          <div className="text-xl font-bold text-gray-900">{consoMoy ? `${consoMoy} L/100km` : '—'}</div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Entretiens */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Historique entretiens</h3>
            <Button size="sm" variant="ghost" onClick={() => setMaintOpen(true)}>
              <Wrench size={12} /> + Ajouter
            </Button>
          </div>
          {maintenances.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">Aucun entretien enregistré.</div>
          ) : (
            <table className="w-full table-dense">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Type</th>
                  <th className="text-right">Coût</th>
                </tr>
              </thead>
              <tbody>
                {maintenances.map(m => (
                  <tr key={m.id}>
                    <td className="text-xs text-gray-600">{formatDate(m.date)}</td>
                    <td>
                      <div className="text-sm font-medium text-gray-800">{m.type}</div>
                      <div className="text-xs text-gray-400 truncate">{m.description}</div>
                    </td>
                    <td className="text-right font-mono text-sm font-semibold">{formatFCFA(m.cout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Carburant */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Suivi carburant</h3>
            <Button size="sm" variant="ghost" onClick={() => setCarburantOpen(true)}>
              <Fuel size={12} /> + Plein
            </Button>
          </div>
          {carburants.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">Aucun plein enregistré.</div>
          ) : (
            <table className="w-full table-dense">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-right">Litres</th>
                  <th className="text-right">KM</th>
                  <th className="text-right">Coût</th>
                </tr>
              </thead>
              <tbody>
                {carburants.map(c => (
                  <tr key={c.id}>
                    <td className="text-xs text-gray-600">{formatDate(c.date)}</td>
                    <td className="text-right font-medium">{c.litres}L</td>
                    <td className="text-right text-xs text-gray-500">{c.kilometrage.toLocaleString()}</td>
                    <td className="text-right font-mono text-sm font-semibold">{formatFCFA(c.cout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pannes history */}
      {pannes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Historique pannes</h3>
          </div>
          <table className="w-full table-dense">
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-left">Description</th>
                <th className="text-left">Statut</th>
                <th className="text-left">Résolution</th>
              </tr>
            </thead>
            <tbody>
              {pannes.map(p => (
                <tr key={p.id}>
                  <td className="text-xs text-gray-600">{formatDate(p.date)}</td>
                  <td className="text-sm text-gray-800">{p.description}</td>
                  <td>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded font-medium',
                      p.statut === 'résolue' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                    )}>
                      {p.statut}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">{p.date_resolution ? formatDate(p.date_resolution) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <Modal open={maintOpen} onClose={() => setMaintOpen(false)} title="Enregistrer un entretien" size="md"
        footer={<><Button variant="secondary" onClick={() => setMaintOpen(false)}>Annuler</Button><Button variant="primary" form="maint-form" type="submit" loading={loading}>Enregistrer</Button></>}
      >
        <form id="maint-form" onSubmit={handleMaint} className="grid grid-cols-2 gap-4">
          <Select label="Type" value={maintForm.type} onChange={e => setMaintForm(f => ({ ...f, type: e.target.value as TypeMaintenance }))}>
            {['vidange','pneus','freins','moteur','carrosserie','révision-générale','autre'].map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Date" type="date" value={maintForm.date} onChange={e => setMaintForm(f => ({ ...f, date: e.target.value }))} required />
          <Input label="Description" value={maintForm.description} onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))} className="col-span-2" />
          <Input label="Prestataire" value={maintForm.prestataire} onChange={e => setMaintForm(f => ({ ...f, prestataire: e.target.value }))} />
          <Input label="Coût (FCFA)" type="number" value={maintForm.cout} onChange={e => setMaintForm(f => ({ ...f, cout: e.target.value }))} />
          <Input label="Kilométrage lors" type="number" value={maintForm.kilometrage_lors} onChange={e => setMaintForm(f => ({ ...f, kilometrage_lors: e.target.value }))} />
        </form>
      </Modal>

      <Modal open={carburantOpen} onClose={() => setCarburantOpen(false)} title="Enregistrer un plein" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCarburantOpen(false)}>Annuler</Button><Button variant="primary" form="car-form" type="submit" loading={loading}>Enregistrer</Button></>}
      >
        <form id="car-form" onSubmit={handleCarburant} className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" value={carburantForm.date} onChange={e => setCarburantForm(f => ({ ...f, date: e.target.value }))} required />
          <Input label="Litres" type="number" step="0.1" value={carburantForm.litres} onChange={e => setCarburantForm(f => ({ ...f, litres: e.target.value }))} required />
          <Input label="Coût total (FCFA)" type="number" value={carburantForm.cout} onChange={e => setCarburantForm(f => ({ ...f, cout: e.target.value }))} />
          <Input label="Kilométrage" type="number" value={carburantForm.kilometrage} onChange={e => setCarburantForm(f => ({ ...f, kilometrage: e.target.value }))} required />
        </form>
      </Modal>

      <Modal open={panneOpen} onClose={() => setPanneOpen(false)} title="Signaler une panne" size="sm"
        footer={<><Button variant="secondary" onClick={() => setPanneOpen(false)}>Annuler</Button><Button variant="danger" onClick={handlePanne} loading={loading}>Signaler</Button></>}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">L'engin passera au statut <strong>En panne</strong>.</p>
          <Textarea label="Description de la panne" value={panneDesc} onChange={e => setPanneDesc(e.target.value)} placeholder="Ex : Fumée noire, moteur qui chauffe…" required />
        </div>
      </Modal>
    </div>
  )
}
