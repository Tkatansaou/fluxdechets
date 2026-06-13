'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, X, ChevronDown, ArrowLeft } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { MOTIF_NON_EFFECTUE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { MotifNonEffectue } from '@/types'

interface AbonneLite { id: string; nom: string; prenom: string; telephone: string; adresse: string | null }
interface Marquage { id: string; abonneId: string; statut: string; motif: string | null; motifDetail: string | null; heureMarquage: string | null }
interface TourneeLite { id: string; date: string; statut: string; zone: { id: string; nom: string }; engin: { id: string; immatriculation: string }; chauffeur: { id: string; name: string | null } }
interface TourneeDetailed extends TourneeLite { marquages: Marquage[] }
interface TourneeItem { id: string; date: string; statut: string; zone: { nom: string }; engin: { immatriculation: string } }

export default function TerrainPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramId = searchParams.get('id')
  const today = new Date().toISOString().split('T')[0]

  const [tourneesAujourd, setTourneesAujourd] = useState<TourneeItem[]>([])
  const [selectedId, setSelectedId] = useState<string>(paramId ?? '')
  const [tournee, setTournee] = useState<TourneeDetailed | null>(null)
  const [abonnes, setAbonnes] = useState<AbonneLite[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [motifModal, setMotifModal] = useState<string | null>(null)
  const [motif, setMotif] = useState<MotifNonEffectue>('autre')
  const [motifDetail, setMotifDetail] = useState('')

  const loadList = useCallback(async () => {
    try {
      const res = await api<{ tournees: TourneeItem[] }>(`/api/tournees?debut=${today}&fin=${today}`)
      const list = (res.tournees ?? []).filter(t => t.statut === 'planifiée' || t.statut === 'en-cours')
      setTourneesAujourd(list)
      if (!selectedId && list.length > 0) setSelectedId(list[0].id)
    } catch { /* silent */ }
  }, [today]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTournee = useCallback(async (id: string) => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    try {
      const [tRes, _abRes] = await Promise.all([
        api<{ tournee: TourneeDetailed }>(`/api/tournees/${id}`),
        api<{ abonnes: AbonneLite[] }>(`/api/abonnes?zoneId=placeholder`), // placeholder — overridden below
      ])
      setTournee(tRes.tournee)
      const aRes = await api<{ abonnes: AbonneLite[] }>(`/api/abonnes?zoneId=${tRes.tournee.zone.id}&limit=200`)
      setAbonnes(aRes.abonnes ?? [])
    } catch {
      toast.error('Tournée introuvable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadList() }, [loadList])
  useEffect(() => {
    if (selectedId) loadTournee(selectedId)
  }, [selectedId, loadTournee])

  const marquer = async (abonneId: string, statut: 'effectué' | 'non-effectué', motifVal?: MotifNonEffectue, motifDetailVal?: string) => {
    if (!selectedId) return
    setSaving(abonneId)
    try {
      await api(`/api/tournees/${selectedId}/marquages`, {
        method: 'POST',
        body: { abonneId, statut, ...(motifVal ? { motif: motifVal, motifDetail: motifDetailVal } : {}) },
      })
      setTournee(prev => {
        if (!prev) return prev
        const existing = prev.marquages.find(m => m.abonneId === abonneId)
        const newM: Marquage = { id: existing?.id ?? '', abonneId, statut, motif: motifVal ?? null, motifDetail: motifDetailVal ?? null, heureMarquage: new Date().toISOString() }
        const marquages = existing ? prev.marquages.map(m => m.abonneId === abonneId ? newM : m) : [...prev.marquages, newM]
        return { ...prev, marquages }
      })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(null)
    }
  }

  const handleNonEffectue = async () => {
    if (!motifModal) return
    await marquer(motifModal, 'non-effectué', motif, motifDetail)
    setMotifModal(null)
    setMotif('autre')
    setMotifDetail('')
  }

  const handleTerminer = async () => {
    if (!selectedId) return
    try {
      await api(`/api/tournees/${selectedId}`, { method: 'PATCH', body: { statut: 'terminée' } })
      setTournee(prev => prev ? { ...prev, statut: 'terminée' } : prev)
      toast.success('Tournée terminée')
    } catch {
      toast.error('Erreur')
    }
  }

  const getMarquage = (abonneId: string) => tournee?.marquages.find(m => m.abonneId === abonneId)

  const done = tournee?.marquages.length ?? 0
  const total = abonnes.length
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  const isTerminee = tournee?.statut === 'terminée'

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/tournees')} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500"><ArrowLeft size={18} /></button>
        <h2 className="font-semibold text-gray-900 text-base">Saisie terrain</h2>
      </div>

      {/* Sélecteur tournée */}
      {tourneesAujourd.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <Select label="Tournée" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            {tourneesAujourd.map(t => (
              <option key={t.id} value={t.id}>{t.zone.nom} — {t.engin.immatriculation}</option>
            ))}
          </Select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      ) : !tournee ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm text-gray-500">Aucune tournée planifiée aujourd&apos;hui</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => router.push('/tournees')}>Voir le planning</Button>
        </div>
      ) : (
        <>
          {/* Info tournée */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900">{tournee.zone.nom}</div>
                <div className="text-xs text-gray-500">{tournee.engin.immatriculation} · {tournee.chauffeur.name ?? '—'}</div>
              </div>
              <span className={cn('text-xs px-2 py-1 rounded-full font-medium', isTerminee ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{tournee.statut}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{done}/{total} abonnés marqués</span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {!isTerminee && done === total && total > 0 && (
              <Button variant="primary" size="sm" className="w-full mt-3" onClick={handleTerminer}>Terminer la tournée</Button>
            )}
          </div>

          {/* Liste abonnés */}
          <div className="space-y-1.5">
            {abonnes.map(ab => {
              const m = getMarquage(ab.id)
              const isLoading = saving === ab.id
              return (
                <div key={ab.id} className={cn('bg-white border rounded-xl p-3 flex items-center gap-3',
                  m?.statut === 'effectué' ? 'border-emerald-200 bg-emerald-50/30' :
                  m?.statut === 'non-effectué' ? 'border-red-200 bg-red-50/30' :
                  'border-gray-200')}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{ab.prenom} {ab.nom}</div>
                    {ab.adresse && <div className="text-xs text-gray-400 truncate">{ab.adresse}</div>}
                    {m?.statut === 'non-effectué' && m.motif && (
                      <div className="text-xs text-red-600 mt-0.5">{MOTIF_NON_EFFECTUE_LABELS[m.motif as MotifNonEffectue] ?? m.motif}</div>
                    )}
                  </div>
                  {isTerminee ? (
                    <div className={cn('text-xs font-medium', m?.statut === 'effectué' ? 'text-emerald-600' : m?.statut === 'non-effectué' ? 'text-red-600' : 'text-gray-400')}>
                      {m?.statut === 'effectué' ? '✓' : m?.statut === 'non-effectué' ? '✗' : '—'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        disabled={isLoading}
                        onClick={() => marquer(ab.id, 'effectué')}
                        className={cn('w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                          m?.statut === 'effectué' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-gray-400 hover:border-emerald-400 hover:text-emerald-500')}>
                        <Check size={14} />
                      </button>
                      <button
                        disabled={isLoading}
                        onClick={() => { setMotifModal(ab.id); setMotif('autre'); setMotifDetail('') }}
                        className={cn('w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                          m?.statut === 'non-effectué' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-500')}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {abonnes.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Aucun abonné dans cette zone.</div>}
          </div>

          {!isTerminee && done > 0 && (
            <Button variant="secondary" size="sm" className="w-full" onClick={handleTerminer}>
              <ChevronDown size={13} /> Terminer la tournée ({done}/{total})
            </Button>
          )}
        </>
      )}

      {/* Modal motif non-effectué */}
      <Modal open={!!motifModal} onClose={() => setMotifModal(null)} title="Motif du non-passage" size="sm"
        footer={<><Button variant="secondary" onClick={() => setMotifModal(null)}>Annuler</Button><Button variant="danger" loading={saving === motifModal} onClick={handleNonEffectue}>Confirmer</Button></>}>
        <div className="space-y-3">
          <Select label="Motif" value={motif} onChange={e => setMotif(e.target.value as MotifNonEffectue)}>
            {Object.entries(MOTIF_NON_EFFECTUE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <input
            className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Précision (optionnel)"
            value={motifDetail}
            onChange={e => setMotifDetail(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
