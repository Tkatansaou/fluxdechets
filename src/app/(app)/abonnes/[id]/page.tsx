'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, Calendar, Link2, Edit, Trash2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { BadgeAbonne } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { cn, formatDate, formatFCFA } from '@/lib/utils'
import { STATUT_ABONNE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface Zone { id: string; nom: string }
interface Paiement { id: string; montant: number; moyen: string; operateur: string | null; statut: string; reference: string; moisConcerne: string; date: string }
interface Marquage { id: string; statut: string; motif: string | null; heureMarquage: string | null; createdAt: string; tournee: { date: string } }
interface Abonne {
  id: string; nom: string; prenom: string; telephone: string; adresse: string | null
  zoneId: string; zone: { nom: string }; statut: string; frequenceCollecte: string
  dateInscription: string; actif: boolean; lienPaiementToken: string; createdAt: string
  paiements: Paiement[]; marquages: Marquage[]
}

export default function FicheAbonnePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [abonne, setAbonne] = useState<Abonne | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [paiementOpen, setPaiementOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', telephone: '', adresse: '', zoneId: '', statut: '' })
  const [moyen, setMoyen] = useState<'espèces' | 'mobile-money'>('espèces')
  const [operateur, setOperateur] = useState<'tmoney' | 'flooz'>('tmoney')
  const [montant, setMontant] = useState('1000')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [abData, zoneData] = await Promise.all([
        api<{ abonne: Abonne }>(`/api/abonnes/${id}`),
        api<{ zones: Zone[] }>('/api/zones'),
      ])
      setAbonne(abData.abonne)
      setZones(zoneData.zones)
      const a = abData.abonne
      setEditForm({ nom: a.nom, prenom: a.prenom, telephone: a.telephone, adresse: a.adresse ?? '', zoneId: a.zoneId, statut: a.statut })
    } catch {
      toast.error('Abonné introuvable')
      router.push('/abonnes')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api<{ abonne: Abonne }>(`/api/abonnes/${id}`, { method: 'PATCH', body: editForm })
      setAbonne(res.abonne)
      setEditOpen(false)
      toast.success('Abonné mis à jour')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Désactiver ${abonne?.prenom} ${abonne?.nom} ? Cette action est réversible.`)) return
    try {
      await api(`/api/abonnes/${id}`, { method: 'DELETE' })
      toast.success('Abonné désactivé')
      router.push('/abonnes')
    } catch {
      toast.error('Erreur lors de la désactivation')
    }
  }

  const handlePaiement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/paiements', {
        method: 'POST',
        body: {
          abonneId: id,
          montant: parseInt(montant),
          moyen,
          ...(moyen === 'mobile-money' ? { operateur } : {}),
          moisConcerne: new Date().toISOString().slice(0, 7),
        },
      })
      toast.success(`Paiement de ${parseInt(montant).toLocaleString()} FCFA enregistré`)
      setPaiementOpen(false)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Chargement…</div>
  if (!abonne) return null

  const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pay/${abonne.lienPaiementToken}`

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">{abonne.prenom} {abonne.nom}</h2>
          <div className="text-xs text-gray-400">#{abonne.id.slice(-6).toUpperCase()}</div>
        </div>
        <BadgeAbonne statut={abonne.statut as Parameters<typeof BadgeAbonne>[0]['statut']} />
        <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}><Edit size={13} /> Modifier</Button>
        <Button size="sm" variant="ghost" onClick={handleDelete}><Trash2 size={13} /></Button>
      </div>

      {/* Info + paiement */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informations</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700"><Phone size={14} className="text-gray-400" />{abonne.telephone}</div>
            {abonne.adresse && <div className="flex items-center gap-2 text-gray-700"><MapPin size={14} className="text-gray-400" />{abonne.adresse}</div>}
            <div className="flex items-center gap-2 text-gray-700"><Calendar size={14} className="text-gray-400" />Inscrit le {formatDate(abonne.dateInscription)}</div>
            <div className="text-gray-600">Zone : <span className="font-medium">{abonne.zone.nom}</span></div>
            <div className="text-gray-600">Fréquence : <span className="font-medium">{abonne.frequenceCollecte}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Link2 size={12} />
              <span className="truncate">{paymentLink}</span>
              <button onClick={() => { navigator.clipboard.writeText(paymentLink); toast.success('Lien copié') }}
                className="shrink-0 text-brand-600 hover:underline">Copier</button>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiements récents</h3>
            <Button size="sm" variant="primary" onClick={() => setPaiementOpen(true)}>+ Paiement</Button>
          </div>
          <div className="space-y-1.5">
            {abonne.paiements.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <div className="text-gray-700">{p.moisConcerne} — <span className="capitalize">{p.moyen}</span></div>
                <div className="font-semibold text-gray-900">{formatFCFA(p.montant)}</div>
              </div>
            ))}
            {abonne.paiements.length === 0 && <div className="text-xs text-gray-400 text-center py-4">Aucun paiement</div>}
          </div>
        </Card>
      </div>

      {/* Historique passages */}
      <Card>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Historique des passages ({abonne.marquages.length})</h3>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {abonne.marquages.map(m => (
            <div key={m.id} className={cn('flex items-center justify-between text-xs px-2 py-1.5 rounded', m.statut === 'effectué' ? 'bg-emerald-50' : 'bg-red-50')}>
              <div className={cn('font-medium', m.statut === 'effectué' ? 'text-emerald-700' : 'text-red-700')}>
                {m.statut === 'effectué' ? '✓ Effectué' : '✗ Non effectué'}{m.motif ? ` — ${m.motif}` : ''}
              </div>
              <div className="text-gray-400">{formatDate(m.tournee.date)}</div>
            </div>
          ))}
          {abonne.marquages.length === 0 && <div className="text-xs text-gray-400 text-center py-4">Aucun passage enregistré</div>}
        </div>
      </Card>

      {/* Modal édition */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier l'abonné" size="md"
        footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Annuler</Button><Button variant="primary" form="edit-form" type="submit" loading={saving}>Enregistrer</Button></>}>
        <form id="edit-form" onSubmit={handleEdit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" value={editForm.prenom} onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))} required />
            <Input label="Nom" value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} required />
          </div>
          <Input label="Téléphone" value={editForm.telephone} onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))} required />
          <Input label="Adresse" value={editForm.adresse} onChange={e => setEditForm(f => ({ ...f, adresse: e.target.value }))} />
          <Select label="Zone" value={editForm.zoneId} onChange={e => setEditForm(f => ({ ...f, zoneId: e.target.value }))}>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </Select>
          <Select label="Statut" value={editForm.statut} onChange={e => setEditForm(f => ({ ...f, statut: e.target.value }))}>
            {Object.entries(STATUT_ABONNE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </form>
      </Modal>

      {/* Modal paiement */}
      <Modal open={paiementOpen} onClose={() => setPaiementOpen(false)} title="Enregistrer un paiement" size="sm"
        footer={<><Button variant="secondary" onClick={() => setPaiementOpen(false)}>Annuler</Button><Button variant="primary" form="pay-form" type="submit" loading={saving}>Valider</Button></>}>
        <form id="pay-form" onSubmit={handlePaiement} className="space-y-3">
          <Select label="Mode de paiement" value={moyen} onChange={e => setMoyen(e.target.value as 'espèces' | 'mobile-money')}>
            <option value="espèces">Espèces</option>
            <option value="mobile-money">Mobile Money</option>
          </Select>
          {moyen === 'mobile-money' && (
            <Select label="Opérateur" value={operateur} onChange={e => setOperateur(e.target.value as 'tmoney' | 'flooz')}>
              <option value="tmoney">Tmoney</option>
              <option value="flooz">Flooz</option>
            </Select>
          )}
          <Input label="Montant (FCFA)" type="number" value={montant} onChange={e => setMontant(e.target.value)} min="100" required />
        </form>
      </Modal>
    </div>
  )
}
