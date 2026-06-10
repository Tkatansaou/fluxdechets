'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

export default function NouvelAbonnePage() {
  const router = useRouter()
  const { state, addAbonne } = useApp()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', adresse: '',
    zone_id: state.zones[0]?.id ?? '',
    frequence_collecte: 'bi-hebdomadaire' as const,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nom.trim()) errs.nom = 'Nom requis'
    if (!form.prenom.trim()) errs.prenom = 'Prénom requis'
    if (!form.telephone.trim()) errs.telephone = 'Téléphone requis'
    if (!form.zone_id) errs.zone_id = 'Zone requise'
    // Doublon check
    const dup = state.abonnes.find(a => a.telephone === form.telephone && a.actif)
    if (dup) errs.telephone = `Un abonné avec ce numéro existe déjà (${dup.prenom} ${dup.nom})`
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    const newAbonne = addAbonne({
      ...form,
      statut: 'impayé',
      date_inscription: new Date().toISOString().split('T')[0],
      actif: true,
    })
    toast.success(`${newAbonne.prenom} ${newAbonne.nom} ajouté au registre`)
    router.push(`/abonnes/${newAbonne.id}`)
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
            <Input
              label="Prénom"
              required
              value={form.prenom}
              onChange={set('prenom')}
              error={errors.prenom}
              placeholder="Kofi"
            />
            <Input
              label="Nom de famille"
              required
              value={form.nom}
              onChange={set('nom')}
              error={errors.nom}
              placeholder="Mensah"
            />
          </div>

          <Input
            label="Numéro de téléphone"
            required
            value={form.telephone}
            onChange={set('telephone')}
            error={errors.telephone}
            placeholder="+22890123456"
            type="tel"
            hint="Format : +228 suivi de 8 chiffres"
          />

          <Input
            label="Adresse / Repère"
            value={form.adresse}
            onChange={set('adresse')}
            placeholder="Ex : Rue de la Paix, maison à gauche du dispensaire"
          />

          <Select
            label="Zone de collecte"
            required
            value={form.zone_id}
            onChange={set('zone_id')}
            error={errors.zone_id}
          >
            <option value="">Choisir une zone…</option>
            {state.zones.map(z => (
              <option key={z.id} value={z.id}>{z.nom}</option>
            ))}
          </Select>

          <Select
            label="Fréquence de collecte"
            value={form.frequence_collecte}
            onChange={set('frequence_collecte')}
          >
            <option value="bi-hebdomadaire">2 fois par semaine</option>
            <option value="hebdomadaire">1 fois par semaine</option>
          </Select>

          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-xs text-gray-500">
            L'abonné sera créé avec le statut <strong>Impayé</strong> par défaut.
            Un lien de paiement unique sera généré automatiquement.
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => router.back()} fullWidth>
              Annuler
            </Button>
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
