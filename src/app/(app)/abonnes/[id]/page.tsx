'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, Calendar, Link2, Edit, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { BadgeAbonne } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { cn, formatDate, formatFCFA, formatDateTime } from '@/lib/utils'
import { STATUT_ABONNE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

export default function FicheAbonnePage() {
  const { id } = useParams()
  const router = useRouter()
  const { state, updateAbonne, deleteAbonne, addPaiement } = useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [paiementOpen, setPaiementOpen] = useState(false)
  const [moyen, setMoyen] = useState<'espèces' | 'mobile-money'>('espèces')
  const [operateur, setOperateur] = useState<'tmoney' | 'flooz'>('tmoney')
  const [montant, setMontant] = useState('1000')
  const [loading, setLoading] = useState(false)

  const abonne = state.abonnes.find(a => a.id === id)
  if (!abonne) {
    return (
      <div className="text-center py-20 text-gray-500">
        Abonné introuvable.
        <button className="block mx-auto mt-3 text-brand-600 text-sm" onClick={() => router.push('/abonnes')}>
          ← Retour à la liste
        </button>
      </div>
    )
  }

  const zone = state.zones.find(z => z.id === abonne.zone_id)
  const paiements = state.paiements.filter(p => p.abonne_id === id).sort((a, b) => b.date.localeCompare(a.date))
  const tourneePassages = state.marquages.filter(m => m.abonne_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at))

  const handlePaiement = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    addPaiement({
      abonne_id: abonne.id,
      montant: parseInt(montant),
      moyen,
      operateur: moyen === 'mobile-money' ? operateur : undefined,
      statut: 'validé',
      date: new Date().toISOString(),
      mois_concerne: new Date().toISOString().slice(0, 7),
    })
    toast.success(`Paiement de ${parseInt(montant).toLocaleString()} FCFA enregistré`)
    setPaiementOpen(false)
    setLoading(false)
  }

  const handleDelete = () => {
    if (confirm(`Désactiver l'abonné ${abonne.prenom} ${abonne.nom} ? Cette action est réversible.`)) {
      deleteAbonne(abonne.id)
      toast.success('Abonné désactivé')
      router.push('/abonnes')
    }
  }

  const paymentLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${abonne.lien_paiement_token}`

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{abonne.prenom} {abonne.nom}</h2>
            <BadgeAbonne statut={abonne.statut} />
          </div>
          <p className="text-xs text-gray-500">ID : {abonne.id} · Inscrit le {formatDate(abonne.date_inscription)}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={() => setPaiementOpen(true)}>
            + Paiement
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
            <Edit size={13} />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-700">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Infos */}
        <Card className="md:col-span-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Coordonnées</h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <Phone size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-900">{abonne.telephone}</span>
            </div>
            {abonne.adresse && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-900">{abonne.adresse}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm text-gray-900">{zone?.nom ?? '—'}</div>
                <div className="text-xs text-gray-400">{abonne.frequence_collecte === 'bi-hebdomadaire' ? '2× par semaine' : '1× par semaine'}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-4 pt-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Lien de paiement</div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate flex-1 text-gray-600">
                /pay/{abonne.lien_paiement_token.slice(0, 12)}…
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { navigator.clipboard.writeText(paymentLink); toast.success('Lien copié') }}
              >
                <Link2 size={12} />
              </Button>
            </div>
          </div>
        </Card>

        {/* Historique paiements */}
        <Card className="md:col-span-2" padding="none">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Historique des paiements ({paiements.length})
            </h3>
          </div>
          {paiements.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Aucun paiement enregistré.</div>
          ) : (
            <table className="w-full table-dense">
              <thead>
                <tr>
                  <th className="text-left">Mois</th>
                  <th className="text-left">Date</th>
                  <th className="text-left">Mode</th>
                  <th className="text-right">Montant</th>
                  <th className="text-left">Référence</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium text-gray-800">{p.mois_concerne}</td>
                    <td className="text-xs text-gray-500">{formatDate(p.date)}</td>
                    <td>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded font-medium',
                        p.moyen === 'mobile-money' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600',
                      )}>
                        {p.moyen === 'mobile-money' ? p.operateur?.toUpperCase() : 'Cash'}
                      </span>
                    </td>
                    <td className="text-right font-mono text-sm font-medium">{formatFCFA(p.montant)}</td>
                    <td className="text-xs text-gray-400 font-mono">{p.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Historique collectes */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Historique des collectes ({tourneePassages.length} passages)
          </h3>
        </div>
        {tourneePassages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Aucun passage enregistré.</div>
        ) : (
          <table className="w-full table-dense">
            <thead>
              <tr>
                <th className="text-left">Tournée</th>
                <th className="text-left">Statut</th>
                <th className="text-left">Heure</th>
                <th className="text-left">Motif</th>
              </tr>
            </thead>
            <tbody>
              {tourneePassages.map(m => {
                const tournee = state.tournees.find(t => t.id === m.tournee_id)
                return (
                  <tr key={m.id}>
                    <td className="text-xs text-gray-600">{tournee?.date ?? '—'}</td>
                    <td>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded font-medium',
                        m.statut === 'effectué' ? 'bg-emerald-50 text-emerald-700' :
                          m.statut === 'non-effectué' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500',
                      )}>
                        {m.statut === 'effectué' ? 'Effectué' : m.statut === 'non-effectué' ? 'Non effectué' : 'En attente'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">
                      {m.heure_marquage ? formatDateTime(m.heure_marquage) : '—'}
                    </td>
                    <td className="text-xs text-gray-500">{m.motif_detail ?? m.motif ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal paiement */}
      <Modal
        open={paiementOpen}
        onClose={() => setPaiementOpen(false)}
        title="Enregistrer un paiement"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaiementOpen(false)}>Annuler</Button>
            <Button variant="primary" form="pay-form" type="submit" loading={loading}>Valider</Button>
          </>
        }
      >
        <form id="pay-form" onSubmit={handlePaiement} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Mode" value={moyen} onChange={e => setMoyen(e.target.value as any)}>
              <option value="espèces">Espèces</option>
              <option value="mobile-money">Mobile Money</option>
            </Select>
            {moyen === 'mobile-money' && (
              <Select label="Opérateur" value={operateur} onChange={e => setOperateur(e.target.value as any)}>
                <option value="tmoney">Tmoney</option>
                <option value="flooz">Flooz</option>
              </Select>
            )}
            <Input label="Montant (FCFA)" type="number" value={montant} onChange={e => setMontant(e.target.value)} min="100" required />
          </div>
        </form>
      </Modal>
    </div>
  )
}
