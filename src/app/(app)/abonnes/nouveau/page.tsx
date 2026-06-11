'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

interface Zone { id: string; nom: string }

export default function NouvelAbonnePage() {
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', adresse: '',
    zoneId: '', frequenceCollecte: 'bi-hebdomadaire',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    api<{ zones: Zone[] }>('/api/zones').then(r => {
      setZones(r.zones)
      if (r.zones.length > 0) setForm(f => ({ ...f, zoneId: r.zones[0].id }))
    }).catch(() => toast.error('Impossible de charger les zones'))
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nom.trim()) errs.nom = 'Nom requis'
    if (!form.prenom.trim()) errs.prenom = 'Prénom requis'
    if (!form.telephone.trim()) errs.telephone = 'Téléphone requis'
    if (!form.zoneId) errs.zoneId = 'Zone requise'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await api<{ abonne: { id: string; prenom: string; nom: string } }>('/api/abonnes', {
        method: 'POST',
        body: form,
      })
      toast.success(`${res.abonne.prenom} ${res.abonne.nom} ajouté au registre`)
      router.push(`/abonnes/${res.abonne.id}`)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_TELEPHONE') setErrors({ telephone: err.message })
        else toast.error(err.message)
      } else {
        toast.error('Erreur réseau')
      }
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => { const n = { ...er }; delete n[field]; return n })
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Nouvel abonné</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" required value={form.prenom} onChange={set('prenom')} placeholder="Kofi" error={errors.prenom} />
            <Input label="Nom" required value={form.nom} onChange={set('nom')} placeholder="Mensah" error={errors.nom} />
          </div>
          <Input label="Téléphone" required value={form.telephone} onChange={set('telephone')} placeholder="+228 90 00 00 00" error={errors.telephone} />
          <Input label="Adresse" value={form.adresse} onChange={set('adresse')} placeholder="Quartier, rue…" />
          <Select label="Zone de collecte" required value={form.zoneId} onChange={set('zoneId')} error={errors.zoneId}>
            <option value="">— Sélectionner —</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </Select>
          <Select label="Fréquence de collecte" value={form.frequenceCollecte} onChange={set('frequenceCollecte')}>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="bi-hebdomadaire">Bi-hebdomadaire</option>
          </Select>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
            <Button type="submit" variant="primary" loading={loading} fullWidth>
              <UserPlus size={15} />
              Créer l'abonné
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
