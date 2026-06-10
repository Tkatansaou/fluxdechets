'use client'

import { useState } from 'react'
import { Check, X, AlertTriangle, ChevronDown } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { MOTIF_NON_EFFECTUE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { MotifNonEffectue } from '@/types'

export default function TerrainPage() {
  const { state, addMarquage, updateTournee } = useApp()
  const today = new Date().toISOString().split('T')[0]
  const [selectedTourneeId, setSelectedTourneeId] = useState<string>('')
  const [motifModal, setMotifModal] = useState<string | null>(null)
  const [motif, setMotif] = useState<MotifNonEffectue>('autre')
  const [motifDetail, setMotifDetail] = useState('')

  const tourneesAujourdHui = state.tournees.filter(t =>
    t.date === today && (t.statut === 'planifiée' || t.statut === 'en-cours')
  )

  const activeTournee = tourneesAujourdHui.find(t => t.id === selectedTourneeId) ?? tourneesAujourdHui[0]

  const marquages = activeTournee
    ? state.marquages.filter(m => m.tournee_id === activeTournee.id)
    : []

  const abonnesTour = activeTournee
    ? state.abonnes.filter(a => a.zone_id === activeTournee.zone_id && a.actif)
    : []

  const getMarquage = (abonneId: string) => marquages.find(m => m.abonne_id === abonneId)

  const handleEffectue = (abonneId: string) => {
    const existing = getMarquage(abonneId)
    if (existing) return
    addMarquage({
      tournee_id: activeTournee!.id,
      abonne_id: abonneId,
      statut: 'effectué',
      heure_marquage: new Date().toISOString(),
    })
    if (activeTournee!.statut === 'planifiée') {
      updateTournee(activeTournee!.id, { statut: 'en-cours' })
    }
    toast.success('Collecte marquée ✓')
  }

  const handleNonEffectue = (abonneId: string) => {
    setMotifModal(abonneId)
  }

  const confirmNonEffectue = () => {
    if (!motifModal || !activeTournee) return
    addMarquage({
      tournee_id: activeTournee.id,
      abonne_id: motifModal,
      statut: 'non-effectué',
      motif,
      motif_detail: motifDetail || undefined,
      heure_marquage: new Date().toISOString(),
    })
    toast.success('Marqué comme non effectué')
    setMotifModal(null)
    setMotifDetail('')
  }

  const handleTerminer = () => {
    if (!activeTournee) return
    const unmarked = abonnesTour.filter(a => !getMarquage(a.id)).length
    if (unmarked > 0 && !confirm(`Il reste ${unmarked} point(s) non marqué(s). Terminer quand même ?`)) return
    updateTournee(activeTournee.id, { statut: 'terminée' })
    toast.success('Tournée terminée !')
  }

  const effectues = abonnesTour.filter(a => getMarquage(a.id)?.statut === 'effectué').length
  const nonEffectues = abonnesTour.filter(a => getMarquage(a.id)?.statut === 'non-effectué').length
  const enAttente = abonnesTour.filter(a => !getMarquage(a.id)).length

  if (tourneesAujourdHui.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📅</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Aucune tournée aujourd'hui</h2>
          <p className="text-sm text-gray-500">Pas de tournée planifiée pour ce jour.</p>
          <a href="/tournees" className="mt-4 inline-block text-brand-600 text-sm hover:underline">
            Voir le planning →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      {/* Sélecteur tournée */}
      {tourneesAujourdHui.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Tournée en cours</label>
          <select
            value={activeTournee?.id}
            onChange={e => setSelectedTourneeId(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm"
          >
            {tourneesAujourdHui.map(t => {
              const zone = state.zones.find(z => z.id === t.zone_id)
              const engin = state.engins.find(e => e.id === t.engin_id)
              return <option key={t.id} value={t.id}>{zone?.nom} — {engin?.immatriculation}</option>
            })}
          </select>
        </div>
      )}

      {/* Header tournée */}
      {activeTournee && (
        <div className="bg-[#0B1F16] text-white rounded-xl p-4">
          <div className="text-sm text-green-300 font-medium mb-0.5">Tournée du {activeTournee.date}</div>
          <div className="text-xl font-bold">
            {state.zones.find(z => z.id === activeTournee.zone_id)?.nom ?? '—'}
          </div>
          <div className="text-sm text-green-200 mt-0.5">
            {state.engins.find(e => e.id === activeTournee.engin_id)?.immatriculation} —{' '}
            {state.users.find(u => u.id === activeTournee.chauffeur_id)?.prenom}
          </div>

          {/* Progress */}
          <div className="mt-3 flex gap-3 text-sm">
            <div className="flex-1 text-center bg-emerald-800/40 rounded-lg py-2">
              <div className="text-2xl font-bold text-emerald-300">{effectues}</div>
              <div className="text-xs text-emerald-400">Effectués</div>
            </div>
            <div className="flex-1 text-center bg-red-800/30 rounded-lg py-2">
              <div className="text-2xl font-bold text-red-300">{nonEffectues}</div>
              <div className="text-xs text-red-400">Non effectués</div>
            </div>
            <div className="flex-1 text-center bg-white/10 rounded-lg py-2">
              <div className="text-2xl font-bold">{enAttente}</div>
              <div className="text-xs text-green-200">En attente</div>
            </div>
          </div>
        </div>
      )}

      {/* Liste points de collecte */}
      <div className="space-y-2">
        {abonnesTour.map(a => {
          const marquage = getMarquage(a.id)
          const done = !!marquage

          return (
            <div
              key={a.id}
              className={cn(
                'bg-white border rounded-xl p-4 transition-colors',
                marquage?.statut === 'effectué' ? 'border-emerald-200 bg-emerald-50' :
                  marquage?.statut === 'non-effectué' ? 'border-red-200 bg-red-50' :
                    'border-gray-200',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{a.prenom} {a.nom}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{a.adresse || 'Pas d\'adresse'}</div>
                  {marquage?.statut === 'non-effectué' && marquage.motif && (
                    <div className="mt-1 text-xs text-red-600">
                      Motif : {MOTIF_NON_EFFECTUE_LABELS[marquage.motif]}
                      {marquage.motif_detail && ` — ${marquage.motif_detail}`}
                    </div>
                  )}
                </div>

                {!done ? (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleNonEffectue(a.id)}
                      className="w-12 h-12 rounded-xl bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors active:scale-95"
                    >
                      <X size={20} className="text-red-600" />
                    </button>
                    <button
                      onClick={() => handleEffectue(a.id)}
                      className="w-12 h-12 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors active:scale-95"
                    >
                      <Check size={20} className="text-emerald-600" />
                    </button>
                  </div>
                ) : (
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    marquage.statut === 'effectué' ? 'bg-emerald-200' : 'bg-red-200',
                  )}>
                    {marquage.statut === 'effectué'
                      ? <Check size={18} className="text-emerald-700" />
                      : <X size={18} className="text-red-700" />
                    }
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Terminer */}
      {activeTournee && activeTournee.statut !== 'terminée' && (
        <Button variant="primary" fullWidth size="lg" onClick={handleTerminer}>
          Terminer la tournée ({effectues + nonEffectues}/{abonnesTour.length} marqués)
        </Button>
      )}

      {/* Modal motif non effectué */}
      {motifModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMotifModal(null)} />
          <div className="relative bg-white rounded-t-2xl w-full max-w-sm p-5 space-y-4 fade-in">
            <h3 className="text-base font-semibold">Motif de non-collecte</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MOTIF_NON_EFFECTUE_LABELS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setMotif(k as MotifNonEffectue)}
                  className={cn(
                    'p-3 border rounded-xl text-sm font-medium text-left transition-colors',
                    motif === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={motifDetail}
              onChange={e => setMotifDetail(e.target.value)}
              placeholder="Détails supplémentaires (optionnel)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setMotifModal(null)}>Annuler</Button>
              <Button variant="danger" fullWidth onClick={confirmNonEffectue}>Confirmer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
