'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
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

interface Zone { id: string; nom: string }
interface Engin { id: string; immatriculation: string; type: string }
interface Membre { id: string; user: { id: string; name: string } }
interface Tournee {
  id: string; date: string; statut: string; notes: string | null
  zone: { nom: string }; engin: { immatriculation: string; type: string }
  chauffeur: { name: string | null; email: string }
  _count: { marquages: number }
}

export default function TourneesPage() {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [tournees, setTournees] = useState<Tournee[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [engins, setEngins] = useState<Engin[]>([])
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ zoneId: '', enginId: '', chauffeurId: '', date: new Date().toISOString().split('T')[0], notes: '' })

  const weekDates = getWeekDates(weekOffset)
  const debut = weekDates[0]
  const fin = weekDates[weekDates.length - 1]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, zRes, eRes, mRes] = await Promise.all([
        api<{ tournees: Tournee[] }>(`/api/tournees?debut=${debut}&fin=${fin}`),
        api<{ zones: Zone[] }>('/api/zones'),
        api<{ engins: Engin[] }>('/api/engins'),
        api<{ membres: Membre[] }>('/api/membres'),
      ])
      setTournees(tRes.tournees ?? [])
      setZones(zRes.zones ?? [])
      setEngins(eRes.engins ?? [])
      setMembres(mRes.membres ?? [])
      if (!form.zoneId && zRes.zones.length > 0) setForm(f => ({ ...f, zoneId: zRes.zones[0].id }))
      if (!form.enginId && eRes.engins.length > 0) setForm(f => ({ ...f, enginId: eRes.engins[0].id }))
      if (!form.chauffeurId && mRes.membres.length > 0) setForm(f => ({ ...f, chauffeurId: mRes.membres[0].user.id }))
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [debut, fin]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.zoneId || !form.enginId || !form.chauffeurId || !form.date) { toast.error('Remplissez tous les champs'); return }
    setSaving(true)
    try {
      await api('/api/tournees', {
        method: 'POST',
        body: { zoneId: form.zoneId, enginId: form.enginId, chauffeurId: form.chauffeurId, date: form.date, notes: form.notes || undefined },
      })
      toast.success('Tournée planifiée')
      setAddOpen(false)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const byDate = weekDates.reduce<Record<string, Tournee[]>>((acc, d) => {
    acc[d] = tournees.filter(t => t.date.startsWith(d))
    return acc
  }, {})

  const total = tournees.length
  const terminees = tournees.filter(t => t.statut === 'terminée').length

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Barre de navigation semaine */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
        <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500"><ChevronLeft size={18} /></button>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">
            {weekOffset === 0 ? 'Cette semaine' : weekOffset === -1 ? 'Semaine dernière' : weekOffset === 1 ? 'Semaine prochaine' : `Semaine du ${formatDate(debut)}`}
          </div>
          <div className="text-xs text-gray-400">{formatDate(debut)} – {formatDate(fin)}</div>
        </div>
        <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500"><ChevronRight size={18} /></button>
      </div>

      {/* Stats + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span><span className="font-bold text-gray-900">{total}</span> tournées</span>
          <span className="text-emerald-600"><span className="font-bold">{terminees}</span> terminées</span>
          {total > 0 && <span className="text-gray-400">{Math.round(terminees / total * 100)}%</span>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => router.push('/tournees/terrain')}>
            <Smartphone size={13} /> Mode terrain
          </Button>
          <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
            <Plus size={13} /> Nouvelle tournée
          </Button>
        </div>
      </div>

      {/* Planning */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {weekDates.map((date, i) => {
            const dayTournees = byDate[date] ?? []
            const isToday = date === new Date().toISOString().split('T')[0]
            return (
              <div key={date} className={cn('bg-white border rounded-xl p-3 min-h-28', isToday ? 'border-brand-300 bg-brand-50/30' : 'border-gray-200')}>
                <div className={cn('text-xs font-semibold mb-2', isToday ? 'text-brand-700' : 'text-gray-500')}>
                  {JOURS_SEMAINE[i]}<br />
                  <span className="font-normal text-gray-400">{date.slice(8)}/{date.slice(5, 7)}</span>
                </div>
                {dayTournees.length === 0 ? (
                  <div className="text-xs text-gray-300 text-center mt-3">—</div>
                ) : (
                  <div className="space-y-1.5">
                    {dayTournees.map(t => (
                      <div key={t.id} className="cursor-pointer" onClick={() => router.push(`/tournees/terrain?id=${t.id}`)}>
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="text-xs font-medium text-gray-800 leading-tight">{t.zone.nom}</div>
                            <div className="text-xs text-gray-400">{t.engin.immatriculation}</div>
                          </div>
                          <BadgeTournee statut={t.statut as Parameters<typeof BadgeTournee>[0]['statut']} />
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{t._count.marquages} marquages</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Liste détaillée */}
      {tournees.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">Toutes les tournées de la semaine</div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Zone</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2 hidden sm:table-cell">Engin</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2 hidden md:table-cell">Chauffeur</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2 hidden md:table-cell">Marquages</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tournees.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/tournees/terrain?id=${t.id}`)}>
                  <td className="px-4 py-2.5 text-sm text-gray-700">{formatDate(t.date)}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{t.zone.nom}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600 hidden sm:table-cell">{t.engin.immatriculation}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600 hidden md:table-cell">{t.chauffeur.name ?? t.chauffeur.email}</td>
                  <td className="px-4 py-2.5 text-sm text-right hidden md:table-cell">{t._count.marquages}</td>
                  <td className="px-4 py-2.5"><BadgeTournee statut={t.statut as Parameters<typeof BadgeTournee>[0]['statut']} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nouvelle tournée */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Planifier une tournée" size="md"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Annuler</Button><Button variant="primary" loading={saving} onClick={handleCreate}>Planifier</Button></>}>
        <div className="space-y-3">
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          <Select label="Zone" value={form.zoneId} onChange={e => setForm(f => ({ ...f, zoneId: e.target.value }))}>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </Select>
          <Select label="Engin" value={form.enginId} onChange={e => setForm(f => ({ ...f, enginId: e.target.value }))}>
            {engins.map(e => <option key={e.id} value={e.id}>{e.immatriculation}</option>)}
          </Select>
          <Select label="Chauffeur" value={form.chauffeurId} onChange={e => setForm(f => ({ ...f, chauffeurId: e.target.value }))}>
            {membres.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
          </Select>
          <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Instructions particulières…" />
        </div>
      </Modal>
    </div>
  )
}
