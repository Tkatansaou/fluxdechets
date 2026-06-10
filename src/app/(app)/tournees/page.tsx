'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select, Input } from '@/components/ui/Input'
import { BadgeTournee } from '@/components/ui/Badge'
import { cn, formatDate } from '@/lib/utils'
import { JOURS_SEMAINE } from '@/lib/constants'
import toast from 'react-hot-toast'

function getWeekDates(offset: number): string[] {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export default function TourneesPage() {
  const router = useRouter()
  const { state, addTournee, updateTournee } = useApp()
  const [weekOffset, setWeekOffset] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [form, setForm] = useState({
    zone_id: state.zones[0]?.id ?? '',
    engin_id: state.engins.find(e => e.statut === 'opérationnel')?.id ?? '',
    chauffeur_id: state.users.find(u => u.role === 'chauffeur')?.id ?? '',
    notes: '',
  })

  const weekDates = getWeekDates(weekOffset)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[5]

  const tourneesOfWeek = state.tournees.filter(t => t.date >= weekStart && t.date <= weekEnd)

  const enginsOpérationnels = state.engins.filter(e => e.statut === 'opérationnel')
  const chauffeurs = state.users.filter(u => u.role === 'chauffeur' && u.actif)

  const handleCreate = async () => {
    if (!form.zone_id || !form.engin_id || !form.chauffeur_id) {
      toast.error('Remplissez tous les champs requis')
      return
    }
    addTournee({
      zone_id: form.zone_id,
      engin_id: form.engin_id,
      chauffeur_id: form.chauffeur_id,
      date: selectedDate,
      statut: 'planifiée',
      notes: form.notes || undefined,
    })
    toast.success('Tournée planifiée')
    setAddOpen(false)
  }

  const getTourneesForDate = (date: string) =>
    tourneesOfWeek.filter(t => t.date === date)

  const getCoveragePercent = () => {
    const covered = weekDates.filter(d => getTourneesForDate(d).some(t => t.statut !== 'annulée')).length
    return Math.round((covered / weekDates.length) * 100)
  }

  const tauxCollecte = (() => {
    const passe = state.tournees.filter(t => t.statut !== 'planifiée' && t.statut !== 'en-cours')
    const eff = passe.filter(t => t.statut === 'terminée')
    return passe.length > 0 ? Math.round((eff.length / passe.length) * 100) : 100
  })()

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
          <div className={cn('text-2xl font-bold', tauxCollecte >= 99 ? 'text-emerald-600' : tauxCollecte >= 85 ? 'text-amber-600' : 'text-red-600')}>
            {tauxCollecte}%
          </div>
          <div className="text-xs text-gray-500">Taux de collecte global</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-gray-900">{getCoveragePercent()}%</div>
          <div className="text-xs text-gray-500">Couverture cette semaine</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-gray-900">
            {tourneesOfWeek.filter(t => t.statut === 'planifiée').length}
          </div>
          <div className="text-xs text-gray-500">Tournées planifiées</div>
        </div>
      </div>

      {/* Planning */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 hover:bg-gray-100 rounded-md">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              Semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[5])}
            </span>
            <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 hover:bg-gray-100 rounded-md">
              <ChevronRight size={16} />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-brand-600 hover:underline">
                Aujourd'hui
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => router.push('/tournees/terrain')}>
              <Smartphone size={13} /> Vue terrain
            </Button>
            <Button size="sm" variant="primary" onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0])
              setAddOpen(true)
            }}>
              <Plus size={13} /> Planifier
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-6 divide-x divide-gray-100">
          {weekDates.map((date, idx) => {
            const tournees = getTourneesForDate(date)
            const today = new Date().toISOString().split('T')[0]
            const isToday = date === today
            const isPast = date < today

            return (
              <div
                key={date}
                className={cn('min-h-[120px] p-2', isToday && 'bg-brand-50')}
              >
                {/* Day header */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className={cn('text-xs font-semibold', isToday ? 'text-brand-700' : 'text-gray-500')}>
                      {JOURS_SEMAINE[idx]}
                    </div>
                    <div className={cn('text-xs', isToday ? 'text-brand-600' : 'text-gray-400')}>
                      {date.slice(8)}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedDate(date); setAddOpen(true) }}
                    className="p-0.5 hover:bg-brand-100 rounded text-gray-400 hover:text-brand-600"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Tournées */}
                <div className="space-y-1.5">
                  {tournees.map(t => {
                    const zone = state.zones.find(z => z.id === t.zone_id)
                    const engin = state.engins.find(e => e.id === t.engin_id)
                    const chauffeur = state.users.find(u => u.id === t.chauffeur_id)
                    return (
                      <div
                        key={t.id}
                        className={cn(
                          'rounded p-1.5 text-xs border cursor-pointer hover:opacity-80',
                          t.statut === 'terminée' ? 'bg-emerald-50 border-emerald-200' :
                            t.statut === 'annulée' ? 'bg-red-50 border-red-200' :
                              t.statut === 'en-cours' ? 'bg-amber-50 border-amber-200' :
                                'bg-blue-50 border-blue-200',
                        )}
                        onClick={() => {
                          if (t.statut === 'planifiée') {
                            if (confirm(`Marquer la tournée ${zone?.nom} comme terminée ?`)) {
                              updateTournee(t.id, { statut: 'terminée' })
                              toast.success('Tournée marquée terminée')
                            }
                          }
                        }}
                      >
                        <div className="font-medium truncate">{zone?.nom ?? '—'}</div>
                        <div className="text-gray-500 truncate">{engin?.immatriculation}</div>
                        <div className="text-gray-400 truncate">{chauffeur?.prenom}</div>
                      </div>
                    )
                  })}

                  {tournees.length === 0 && !isPast && (
                    <div className="text-xs text-gray-300 text-center mt-2">—</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Zones non couvertes */}
      {state.zones.some(z => !weekDates.some(d => tourneesOfWeek.some(t => t.zone_id === z.id && t.date === d && t.statut !== 'annulée'))) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <div className="text-sm font-semibold text-amber-800 mb-1">Zones sans couverture cette semaine</div>
          <div className="flex flex-wrap gap-2">
            {state.zones
              .filter(z => !weekDates.some(d => tourneesOfWeek.some(t => t.zone_id === z.id && t.date === d && t.statut !== 'annulée')))
              .map(z => (
                <span key={z.id} className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded">
                  {z.nom}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Modal planification */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Planifier une tournée — ${selectedDate}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleCreate}>Planifier</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Date"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            required
          />
          <Select label="Zone" value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))} required>
            <option value="">Choisir une zone…</option>
            {state.zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </Select>
          <Select label="Engin" value={form.engin_id} onChange={e => setForm(f => ({ ...f, engin_id: e.target.value }))} required>
            <option value="">Choisir un engin…</option>
            {enginsOpérationnels.map(e => <option key={e.id} value={e.id}>{e.immatriculation} — {e.marque}</option>)}
          </Select>
          <Select label="Chauffeur" value={form.chauffeur_id} onChange={e => setForm(f => ({ ...f, chauffeur_id: e.target.value }))} required>
            <option value="">Choisir un chauffeur…</option>
            {chauffeurs.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
          </Select>
          <Input label="Notes (optionnel)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Remarques particulières…" />
        </div>
      </Modal>
    </div>
  )
}
