'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Wrench, Fuel, AlertTriangle, CheckCircle } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { BadgeEngin } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { formatDate, formatFCFA } from '@/lib/utils'
import { TYPE_ENGIN_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface Maintenance { id: string; type: string; description: string | null; cout: number; date: string; prestataire: string | null; kilometrageLors: number | null }
interface Carburant { id: string; litres: number; cout: number; kilometrage: number; date: string }
interface Panne { id: string; description: string; date: string; statut: string; coutReparation: number | null; dateResolution: string | null }
interface Engin {
  id: string; immatriculation: string; type: string; marque: string | null; modele: string | null
  annee: number | null; statut: string; kilometrage: number; dateAcquisition: string | null
  maintenances: Maintenance[]; carburants: Carburant[]; pannes: Panne[]
}

export default function FicheEnginPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [engin, setEngin] = useState<Engin | null>(null)
  const [loading, setLoading] = useState(true)
  const [maintOpen, setMaintOpen] = useState(false)
  const [carburantOpen, setCarburantOpen] = useState(false)
  const [panneOpen, setPanneOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [maintForm, setMaintForm] = useState({ type: 'vidange', description: '', cout: '', prestataire: '', kilometrageLors: '', date: new Date().toISOString().split('T')[0] })
  const [carburantForm, setCarburantForm] = useState({ litres: '', cout: '', kilometrage: '', date: new Date().toISOString().split('T')[0] })
  const [panneDesc, setPanneDesc] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api<{ engin: Engin }>(`/api/engins/${id}`)
      setEngin(res.engin)
      setMaintForm(f => ({ ...f, kilometrageLors: String(res.engin.kilometrage) }))
      setCarburantForm(f => ({ ...f, kilometrage: String(res.engin.kilometrage) }))
    } catch {
      toast.error('Engin introuvable')
      router.push('/engins')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  const patch = async (body: Record<string, unknown>, successMsg: string) => {
    setSaving(true)
    try {
      await api(`/api/engins/${id}`, { method: 'PATCH', body })
      toast.success(successMsg)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleMaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await patch({ action: 'maintenance', type: maintForm.type, description: maintForm.description, cout: parseInt(maintForm.cout) || 0, date: maintForm.date, prestataire: maintForm.prestataire, kilometrageLors: parseInt(maintForm.kilometrageLors) || undefined }, 'Entretien enregistré')
    setMaintOpen(false)
  }

  const handleCarburant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await patch({ action: 'carburant', litres: parseFloat(carburantForm.litres), cout: parseInt(carburantForm.cout), kilometrage: parseInt(carburantForm.kilometrage), date: carburantForm.date }, 'Plein enregistré')
    setCarburantOpen(false)
  }

  const handlePanne = async () => {
    if (!panneDesc) { toast.error('Décrivez la panne'); return }
    await patch({ action: 'panne', description: panneDesc, date: new Date().toISOString().split('T')[0] }, 'Panne signalée')
    setPanneOpen(false)
    setPanneDesc('')
  }

  const handleResolvePanne = async (panneId: string) => {
    await patch({ action: 'resolve-panne', panneId }, 'Panne résolue')
  }

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Chargement…</div>
  if (!engin) return null

  const pannesActives = engin.pannes.filter(p => p.statut === 'ouverte' || p.statut === 'en-cours')
  const carburants = engin.carburants
  const consoMoy = carburants.length >= 2
    ? (() => {
        const sorted = [...carburants].sort((a, b) => a.kilometrage - b.kilometrage)
        const kmDelta = sorted[sorted.length - 1].kilometrage - sorted[0].kilometrage
        const litres = sorted.slice(1).reduce((s, c) => s + c.litres, 0)
        return kmDelta > 0 ? ((litres / kmDelta) * 100).toFixed(1) : null
      })()
    : null

  const setMF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMaintForm(f => ({ ...f, [k]: e.target.value }))
  const setCF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setCarburantForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">{engin.immatriculation}</h2>
          <div className="text-xs text-gray-500">{TYPE_ENGIN_LABELS[engin.type as keyof typeof TYPE_ENGIN_LABELS] ?? engin.type}{engin.marque ? ` — ${engin.marque} ${engin.modele ?? ''}` : ''}</div>
        </div>
        <BadgeEngin statut={engin.statut as Parameters<typeof BadgeEngin>[0]['statut']} />
      </div>

      {/* Pannes actives */}
      {pannesActives.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
          {pannesActives.map(p => (
            <div key={p.id} className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-red-800">{p.description}</div>
                  <div className="text-xs text-red-500">Depuis le {formatDate(p.date)}</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleResolvePanne(p.id)}>
                <CheckCircle size={12} /> Résoudre
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Kilométrage', val: `${engin.kilometrage.toLocaleString()} km`, icon: Fuel },
          { label: 'Conso. moy.', val: consoMoy ? `${consoMoy} L/100km` : '—', icon: Fuel },
          { label: 'Maintenances', val: engin.maintenances.length, icon: Wrench },
          { label: 'Pannes total', val: engin.pannes.length, icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">{s.val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="secondary" onClick={() => setMaintOpen(true)}><Wrench size={13} /> Entretien</Button>
        <Button size="sm" variant="secondary" onClick={() => setCarburantOpen(true)}><Fuel size={13} /> Plein carburant</Button>
        {engin.statut !== 'en-panne' && (
          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setPanneOpen(true)}>
            <AlertTriangle size={13} /> Signaler panne
          </Button>
        )}
      </div>

      {/* Maintenances */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">Historique entretiens ({engin.maintenances.length})</div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Type</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2 hidden sm:table-cell">Description</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2">Coût</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2 hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {engin.maintenances.map(m => (
              <tr key={m.id}>
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900 capitalize">{m.type}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">{m.description ?? '—'}</td>
                <td className="px-4 py-2.5 text-sm text-right font-medium text-gray-900">{formatFCFA(m.cout)}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400 hidden md:table-cell">{formatDate(m.date)}</td>
              </tr>
            ))}
            {engin.maintenances.length === 0 && <tr><td colSpan={4} className="text-center text-xs text-gray-400 py-6">Aucun entretien enregistré</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Carburants */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">Approvisionnements carburant ({engin.carburants.length})</div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2">Litres</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2">Coût</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2 hidden sm:table-cell">Km</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2 hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {engin.carburants.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 text-sm text-right">{c.litres} L</td>
                <td className="px-4 py-2.5 text-sm font-medium text-right text-gray-900">{formatFCFA(c.cout)}</td>
                <td className="px-4 py-2.5 text-xs text-right text-gray-500 hidden sm:table-cell">{c.kilometrage.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400 hidden md:table-cell">{formatDate(c.date)}</td>
              </tr>
            ))}
            {engin.carburants.length === 0 && <tr><td colSpan={4} className="text-center text-xs text-gray-400 py-6">Aucun plein enregistré</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <Modal open={maintOpen} onClose={() => setMaintOpen(false)} title="Enregistrer un entretien" size="md"
        footer={<><Button variant="secondary" onClick={() => setMaintOpen(false)}>Annuler</Button><Button variant="primary" form="maint-form" type="submit" loading={saving}>Enregistrer</Button></>}>
        <form id="maint-form" onSubmit={handleMaint} className="space-y-3">
          <Select label="Type" value={maintForm.type} onChange={setMF('type')}>
            {['vidange','pneus','freins','moteur','carrosserie','révision-générale','autre'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </Select>
          <Textarea label="Description" value={maintForm.description} onChange={setMF('description')} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Coût (FCFA)" type="number" value={maintForm.cout} onChange={setMF('cout')} min="0" />
            <Input label="Km lors de l'entretien" type="number" value={maintForm.kilometrageLors} onChange={setMF('kilometrageLors')} min="0" />
            <Input label="Prestataire" value={maintForm.prestataire} onChange={setMF('prestataire')} />
            <Input label="Date" type="date" value={maintForm.date} onChange={setMF('date')} required />
          </div>
        </form>
      </Modal>

      <Modal open={carburantOpen} onClose={() => setCarburantOpen(false)} title="Enregistrer un plein" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCarburantOpen(false)}>Annuler</Button><Button variant="primary" form="carb-form" type="submit" loading={saving}>Enregistrer</Button></>}>
        <form id="carb-form" onSubmit={handleCarburant} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Litres" type="number" value={carburantForm.litres} onChange={setCF('litres')} min="0" step="0.1" required />
            <Input label="Coût (FCFA)" type="number" value={carburantForm.cout} onChange={setCF('cout')} min="0" required />
            <Input label="Kilométrage actuel" type="number" value={carburantForm.kilometrage} onChange={setCF('kilometrage')} min="0" required />
            <Input label="Date" type="date" value={carburantForm.date} onChange={setCF('date')} required />
          </div>
        </form>
      </Modal>

      <Modal open={panneOpen} onClose={() => { setPanneOpen(false); setPanneDesc('') }} title="Signaler une panne" size="sm"
        footer={<><Button variant="secondary" onClick={() => { setPanneOpen(false); setPanneDesc('') }}>Annuler</Button><Button variant="danger" loading={saving} onClick={handlePanne}>Signaler</Button></>}>
        <Input label="Description de la panne" value={panneDesc} onChange={e => setPanneDesc(e.target.value)} placeholder="Moteur, freins, pneu…" required />
      </Modal>
    </div>
  )
}
