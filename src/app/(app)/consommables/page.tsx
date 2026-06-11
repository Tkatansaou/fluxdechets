'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { cn, formatDate, formatFCFA } from '@/lib/utils'
import { CATEGORIE_CONSOMMABLE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface Consommable { id: string; nom: string; categorie: string; unite: string; stockActuel: number; seuilAlerte: number; prixUnitaire: number }
interface Mouvement { id: string; type: string; quantite: number; date: string; motif: string | null; createdAt: string; consommable: { id: string; nom: string; unite: string } }

export default function ConsommablesPage() {
  const [consommables, setConsommables] = useState<Consommable[]>([])
  const [mouvements, setMouvements] = useState<Mouvement[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [mouvOpen, setMouvOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: '', categorie: 'autre', unite: '', stockActuel: '', seuilAlerte: '', prixUnitaire: '' })
  const [mouvForm, setMouvForm] = useState({ type: 'entrée', quantite: '', motif: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api<{ consommables: Consommable[]; mouvementsRecents: Mouvement[] }>('/api/consommables')
      setConsommables(res.consommables ?? [])
      setMouvements(res.mouvementsRecents ?? [])
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.nom || !form.unite) { toast.error('Remplissez les champs requis'); return }
    setSaving(true)
    try {
      await api('/api/consommables', {
        method: 'POST',
        body: { nom: form.nom, categorie: form.categorie, unite: form.unite, stockActuel: parseInt(form.stockActuel) || 0, seuilAlerte: parseInt(form.seuilAlerte) || 0, prixUnitaire: parseInt(form.prixUnitaire) || 0 },
      })
      toast.success(`Consommable "${form.nom}" créé`)
      setAddOpen(false)
      setForm({ nom: '', categorie: 'autre', unite: '', stockActuel: '', seuilAlerte: '', prixUnitaire: '' })
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleMouvement = async () => {
    if (!mouvOpen || !mouvForm.quantite) { toast.error('Saisissez la quantité'); return }
    const cons = consommables.find(c => c.id === mouvOpen)
    setSaving(true)
    try {
      await api(`/api/consommables/${mouvOpen}`, {
        method: 'POST',
        body: { type: mouvForm.type, quantite: parseInt(mouvForm.quantite), motif: mouvForm.motif || undefined, date: new Date().toISOString().split('T')[0] },
      })
      toast.success(`${mouvForm.type === 'entrée' ? '+' : '-'}${mouvForm.quantite} ${cons?.unite ?? ''} enregistré(s)`)
      setMouvOpen(null)
      setMouvForm({ type: 'entrée', quantite: '', motif: '' })
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const alertes = consommables.filter(c => c.stockActuel <= c.seuilAlerte)
  const byCategorie = Object.entries(CATEGORIE_CONSOMMABLE_LABELS).map(([k, label]) => ({
    key: k, label,
    items: consommables.filter(c => c.categorie === k),
  })).filter(g => g.items.length > 0)

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">{alertes.length} stock(s) en alerte</span>
          </div>
          <div className="space-y-1">
            {alertes.map(c => (
              <div key={c.id} className="flex items-center justify-between text-xs text-amber-700">
                <span>{c.nom}</span>
                <span className="font-medium">{c.stockActuel} {c.unite} restants (seuil : {c.seuilAlerte})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{consommables.length} consommables</h3>
        <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}><Plus size={13} /> Nouveau consommable</Button>
      </div>

      {/* Par catégorie */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      ) : (
        byCategorie.map(cat => (
          <div key={cat.key} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
              <Package size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">{cat.label}</span>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Produit</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2">Stock</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2 hidden sm:table-cell">Prix unit.</th>
                  <th className="px-4 py-2 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cat.items.map(c => (
                  <tr key={c.id} className={cn(c.stockActuel <= c.seuilAlerte && 'bg-amber-50/50')}>
                    <td className="px-4 py-2.5">
                      <div className="text-sm font-medium text-gray-900">{c.nom}</div>
                      {c.stockActuel <= c.seuilAlerte && <div className="text-xs text-amber-600 font-medium">⚠ Stock bas</div>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={cn('text-sm font-semibold', c.stockActuel <= c.seuilAlerte ? 'text-amber-700' : 'text-gray-900')}>
                        {c.stockActuel} {c.unite}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-500 hidden sm:table-cell">{c.prixUnitaire > 0 ? formatFCFA(c.prixUnitaire) : '—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => { setMouvOpen(c.id); setMouvForm({ type: 'entrée', quantite: '', motif: '' }) }}
                          className="p-1 rounded hover:bg-emerald-100 text-emerald-600" title="Entrée"><ArrowDown size={13} /></button>
                        <button onClick={() => { setMouvOpen(c.id); setMouvForm({ type: 'sortie', quantite: '', motif: '' }) }}
                          className="p-1 rounded hover:bg-red-100 text-red-600" title="Sortie"><ArrowUp size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* Derniers mouvements */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Derniers mouvements de stock</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Consommable</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Type</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2">Quantité</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2 hidden md:table-cell">Motif</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2 hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mouvements.map(m => (
              <tr key={m.id}>
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{m.consommable.nom}</td>
                <td className="px-4 py-2.5">
                  <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', m.type === 'entrée' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                    {m.type === 'entrée' ? '↓ Entrée' : '↑ Sortie'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm text-right font-medium">{m.type === 'entrée' ? '+' : '-'}{m.quantite} {m.consommable.unite}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell">{m.motif ?? '—'}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">{formatDate(m.date)}</td>
              </tr>
            ))}
            {mouvements.length === 0 && <tr><td colSpan={5} className="text-center text-xs text-gray-400 py-6">Aucun mouvement enregistré.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal nouveau consommable */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nouveau consommable" size="md"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Annuler</Button><Button variant="primary" loading={saving} onClick={handleCreate}>Créer</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nom" required value={form.nom} onChange={setF('nom')} placeholder="Gazole 500ppm" className="col-span-2" />
          <Select label="Catégorie" value={form.categorie} onChange={setF('categorie')}>
            {Object.entries(CATEGORIE_CONSOMMABLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Unité" required value={form.unite} onChange={setF('unite')} placeholder="litres, unités, paires…" />
          <Input label="Stock initial" type="number" value={form.stockActuel} onChange={setF('stockActuel')} min="0" />
          <Input label="Seuil d'alerte" type="number" value={form.seuilAlerte} onChange={setF('seuilAlerte')} min="0" hint="Alerte si stock ≤ ce seuil" />
          <Input label="Prix unitaire (FCFA)" type="number" value={form.prixUnitaire} onChange={setF('prixUnitaire')} className="col-span-2" />
        </div>
      </Modal>

      {/* Modal mouvement */}
      {mouvOpen && (
        <Modal open onClose={() => setMouvOpen(null)}
          title={`${mouvForm.type === 'entrée' ? 'Entrée' : 'Sortie'} — ${consommables.find(c => c.id === mouvOpen)?.nom}`}
          size="sm"
          footer={<><Button variant="secondary" onClick={() => setMouvOpen(null)}>Annuler</Button><Button variant={mouvForm.type === 'entrée' ? 'primary' : 'danger'} loading={saving} onClick={handleMouvement}>Enregistrer</Button></>}>
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['entrée', 'sortie'] as const).map(t => (
                <button key={t} onClick={() => setMouvForm(f => ({ ...f, type: t }))}
                  className={cn('flex-1 py-2 rounded-md text-sm font-medium border transition-colors',
                    mouvForm.type === t
                      ? t === 'entrée' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')}>
                  {t === 'entrée' ? '↓ Entrée' : '↑ Sortie'}
                </button>
              ))}
            </div>
            <Input label={`Quantité (${consommables.find(c => c.id === mouvOpen)?.unite ?? ''})`} type="number" value={mouvForm.quantite}
              onChange={e => setMouvForm(f => ({ ...f, quantite: e.target.value }))} min="1" required />
            <Input label="Motif" value={mouvForm.motif}
              onChange={e => setMouvForm(f => ({ ...f, motif: e.target.value }))}
              placeholder={mouvForm.type === 'entrée' ? 'Approvisionnement…' : 'Dotation agents, utilisation véhicule…'} />
          </div>
        </Modal>
      )}
    </div>
  )
}
