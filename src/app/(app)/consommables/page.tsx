'use client'

import { useState } from 'react'
import { Plus, Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { cn, formatDate, formatFCFA } from '@/lib/utils'
import { CATEGORIE_CONSOMMABLE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { CategorieConsommable, TypeMouvement } from '@/types'

export default function ConsommablesPage() {
  const { state, addConsommable, addMouvementStock } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [mouvOpen, setMouvOpen] = useState<string | null>(null)
  const [form, setForm] = useState({ nom: '', categorie: 'autre' as CategorieConsommable, unite: '', stock_actuel: '', seuil_alerte: '', prix_unitaire: '' })
  const [mouvForm, setMouvForm] = useState({ type: 'entrée' as TypeMouvement, quantite: '', motif: '' })

  const alertes = state.consommables.filter(c => c.stock_actuel <= c.seuil_alerte)
  const recentMouvements = state.mouvements_stock.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10)

  const handleCreate = () => {
    if (!form.nom || !form.unite) { toast.error('Remplissez les champs requis'); return }
    addConsommable({
      nom: form.nom,
      categorie: form.categorie,
      unite: form.unite,
      stock_actuel: parseInt(form.stock_actuel) || 0,
      seuil_alerte: parseInt(form.seuil_alerte) || 0,
      prix_unitaire: parseInt(form.prix_unitaire) || 0,
    })
    toast.success(`Consommable "${form.nom}" créé`)
    setAddOpen(false)
    setForm({ nom: '', categorie: 'autre', unite: '', stock_actuel: '', seuil_alerte: '', prix_unitaire: '' })
  }

  const handleMouvement = () => {
    if (!mouvOpen || !mouvForm.quantite) { toast.error('Saisissez la quantité'); return }
    const cons = state.consommables.find(c => c.id === mouvOpen)!
    addMouvementStock({
      consommable_id: mouvOpen,
      type: mouvForm.type,
      quantite: parseInt(mouvForm.quantite),
      date: new Date().toISOString().split('T')[0],
      motif: mouvForm.motif || (mouvForm.type === 'entrée' ? 'Approvisionnement' : 'Consommation'),
      agent_id: 'user-1',
    })
    toast.success(`${mouvForm.type === 'entrée' ? '+' : '-'}${mouvForm.quantite} ${cons.unite} enregistré(s)`)
    setMouvOpen(null)
    setMouvForm({ type: 'entrée', quantite: '', motif: '' })
  }

  const byCategorie = Object.entries(CATEGORIE_CONSOMMABLE_LABELS).map(([k, label]) => ({
    key: k,
    label,
    items: state.consommables.filter(c => c.categorie === k),
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Alertes stocks */}
      {alertes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">{alertes.length} stock(s) en alerte</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {alertes.map(c => (
              <div key={c.id} className="bg-amber-100 border border-amber-200 rounded-md px-3 py-2 text-xs">
                <div className="font-semibold text-amber-800">{c.nom}</div>
                <div className="text-amber-700">{c.stock_actuel} {c.unite} — seuil {c.seuil_alerte}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{state.consommables.length} consommables suivis</h3>
        <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
          <Plus size={13} /> Nouveau consommable
        </Button>
      </div>

      {/* Groups by category */}
      {byCategorie.map(group => (
        <div key={group.key} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{group.label}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {group.items.map(c => {
              const pct = Math.min(Math.round((c.stock_actuel / Math.max(c.seuil_alerte * 3, 1)) * 100), 100)
              const isLow = c.stock_actuel <= c.seuil_alerte
              return (
                <div key={c.id} className="px-4 py-3 flex items-center gap-4">
                  <div className={cn('w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0', isLow ? 'bg-red-100' : 'bg-gray-100')}>
                    <Package size={14} className={isLow ? 'text-red-600' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{c.nom}</span>
                      {isLow && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                          Stock bas
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={cn('h-1.5 rounded-full', isLow ? 'bg-red-500' : 'bg-emerald-500')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {c.stock_actuel} / seuil {c.seuil_alerte} {c.unite}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-gray-900 tabular-nums">{c.stock_actuel}</div>
                    <div className="text-xs text-gray-400">{c.unite}</div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => { setMouvOpen(c.id); setMouvForm({ type: 'entrée', quantite: '', motif: '' }) }}
                      className="w-7 h-7 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center transition-colors"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      onClick={() => { setMouvOpen(c.id); setMouvForm({ type: 'sortie', quantite: '', motif: '' }) }}
                      className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-700 rounded-md flex items-center justify-center transition-colors"
                    >
                      <ArrowUp size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Recent mouvements */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Derniers mouvements de stock</h3>
        </div>
        <table className="w-full table-dense">
          <thead>
            <tr>
              <th className="text-left">Consommable</th>
              <th className="text-left">Type</th>
              <th className="text-right">Quantité</th>
              <th className="text-left hidden md:table-cell">Motif</th>
              <th className="text-left hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentMouvements.map(m => {
              const cons = state.consommables.find(c => c.id === m.consommable_id)
              return (
                <tr key={m.id}>
                  <td className="font-medium text-sm text-gray-900">{cons?.nom ?? '—'}</td>
                  <td>
                    <span className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded',
                      m.type === 'entrée' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                    )}>
                      {m.type === 'entrée' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td className="text-right font-bold tabular-nums text-gray-900">
                    {m.type === 'entrée' ? '+' : '−'}{m.quantite} {cons?.unite}
                  </td>
                  <td className="hidden md:table-cell text-xs text-gray-500">{m.motif}</td>
                  <td className="hidden sm:table-cell text-xs text-gray-400">{formatDate(m.date)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {recentMouvements.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">Aucun mouvement enregistré.</div>
        )}
      </div>

      {/* Modal nouveau consommable */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nouveau consommable" size="md"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Annuler</Button><Button variant="primary" onClick={handleCreate}>Créer</Button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nom" required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Gazole 500ppm" className="col-span-2" />
          <Select label="Catégorie" value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value as CategorieConsommable }))}>
            {Object.entries(CATEGORIE_CONSOMMABLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Unité" required value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))} placeholder="litres, unités, paires…" />
          <Input label="Stock initial" type="number" value={form.stock_actuel} onChange={e => setForm(f => ({ ...f, stock_actuel: e.target.value }))} min="0" />
          <Input label="Seuil d'alerte" type="number" value={form.seuil_alerte} onChange={e => setForm(f => ({ ...f, seuil_alerte: e.target.value }))} min="0" hint="Alerte si stock ≤ ce seuil" />
          <Input label="Prix unitaire (FCFA)" type="number" value={form.prix_unitaire} onChange={e => setForm(f => ({ ...f, prix_unitaire: e.target.value }))} />
        </div>
      </Modal>

      {/* Modal mouvement */}
      {mouvOpen && (
        <Modal open onClose={() => setMouvOpen(null)}
          title={`${mouvForm.type === 'entrée' ? 'Entrée de stock' : 'Sortie de stock'} — ${state.consommables.find(c => c.id === mouvOpen)?.nom}`}
          size="sm"
          footer={<><Button variant="secondary" onClick={() => setMouvOpen(null)}>Annuler</Button><Button variant={mouvForm.type === 'entrée' ? 'primary' : 'danger'} onClick={handleMouvement}>Enregistrer</Button></>}
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              {['entrée', 'sortie'].map(t => (
                <button
                  key={t}
                  onClick={() => setMouvForm(f => ({ ...f, type: t as TypeMouvement }))}
                  className={cn(
                    'flex-1 py-2 rounded-md text-sm font-medium border transition-colors',
                    mouvForm.type === t
                      ? t === 'entrée' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                  )}
                >
                  {t === 'entrée' ? '↓ Entrée' : '↑ Sortie'}
                </button>
              ))}
            </div>
            <Input
              label={`Quantité (${state.consommables.find(c => c.id === mouvOpen)?.unite ?? ''})`}
              type="number"
              value={mouvForm.quantite}
              onChange={e => setMouvForm(f => ({ ...f, quantite: e.target.value }))}
              min="1"
              required
            />
            <Input
              label="Motif"
              value={mouvForm.motif}
              onChange={e => setMouvForm(f => ({ ...f, motif: e.target.value }))}
              placeholder={mouvForm.type === 'entrée' ? 'Approvisionnement mensuel…' : 'Dotation agents, utilisation véhicule…'}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
