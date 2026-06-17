'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, Users, MapPin, Landmark } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type OrgData = {
  id: string
  name: string
  slug: string
  typeOrg: string
}

type ProfilData = {
  commune: string
  telephone: string | null
  adresse: string | null
  region: string | null
  budgetAnnuel: number | null
  numContrat: string | null
  dateContrat: string | null
  objectifAbonnes: number
  objectifRecouvrement: number
  objectifCollecte: number
}

type Zone = {
  id: string
  nom: string
  description: string | null
  frequenceCollecte: string
  _count: { abonnes: number }
}

type Member = {
  id: string
  role: string
  user: { id: string; name: string | null; email: string }
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propriétaire',
  ADMIN: 'Administrateur',
  MEMBER: 'Membre',
  CHAUFFEUR: 'Chauffeur',
  RECOUVREMENT: 'Agent recouvrement',
}

export default function ParametresPage() {
  const [tab, setTab] = useState<'organisation' | 'utilisateurs' | 'zones'>('organisation')

  const [org, setOrg] = useState<OrgData | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const [orgForm, setOrgForm] = useState({
    orgName: '', commune: '', region: '', telephone: '', adresse: '',
    numContrat: '', dateContrat: '', budgetAnnuel: '',
    objectifAbonnes: 900, objectifRecouvrement: 80, objectifCollecte: 99,
  })

  const [zoneModal, setZoneModal] = useState(false)
  const [zoneForm, setZoneForm] = useState({ nom: '', description: '', frequenceCollecte: 'bi-hebdomadaire' })
  const [savingOrg, setSavingOrg] = useState(false)
  const [savingZone, setSavingZone] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [paramRes, zoneRes, membresRes] = await Promise.all([
        api<{ org: OrgData; profil: ProfilData | null }>('/api/parametres'),
        api<{ zones: Zone[] }>('/api/zones'),
        api<{ membres: Member[] }>('/api/membres'),
      ])
      setOrg(paramRes.org)
      setZones(zoneRes.zones)
      setMembers(membresRes.membres ?? [])

      const p = paramRes.profil
      setOrgForm({
        orgName: paramRes.org.name,
        commune: p?.commune ?? '',
        region: p?.region ?? '',
        telephone: p?.telephone ?? '',
        adresse: p?.adresse ?? '',
        numContrat: p?.numContrat ?? '',
        dateContrat: p?.dateContrat ? p.dateContrat.split('T')[0] : '',
        budgetAnnuel: p?.budgetAnnuel?.toString() ?? '',
        objectifAbonnes: p?.objectifAbonnes ?? 900,
        objectifRecouvrement: p?.objectifRecouvrement ?? 80,
        objectifCollecte: p?.objectifCollecte ?? 99,
      })
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaveOrg = async () => {
    setSavingOrg(true)
    try {
      const isMairie = org?.typeOrg === 'mairie'
      await api('/api/parametres', {
        method: 'PATCH',
        body: {
          orgName: orgForm.orgName,
          commune: orgForm.commune,
          region: orgForm.region || undefined,
          telephone: orgForm.telephone,
          adresse: orgForm.adresse,
          ...(isMairie
            ? { budgetAnnuel: orgForm.budgetAnnuel ? parseInt(orgForm.budgetAnnuel) : undefined }
            : {
                numContrat: orgForm.numContrat,
                dateContrat: orgForm.dateContrat || undefined,
              }
          ),
          objectifAbonnes: orgForm.objectifAbonnes,
          objectifRecouvrement: orgForm.objectifRecouvrement,
          objectifCollecte: orgForm.objectifCollecte,
        },
      })
      toast.success('Organisation mise à jour')
      load()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingOrg(false)
    }
  }

  const handleCreateZone = async () => {
    if (!zoneForm.nom) { toast.error('Nom de zone requis'); return }
    setSavingZone(true)
    try {
      await api('/api/zones', { method: 'POST', body: zoneForm })
      toast.success(`Zone "${zoneForm.nom}" créée`)
      setZoneModal(false)
      setZoneForm({ nom: '', description: '', frequenceCollecte: 'bi-hebdomadaire' })
      load()
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setSavingZone(false)
    }
  }

  const isMairie = org?.typeOrg === 'mairie'

  const tabs = [
    { id: 'organisation', label: 'Organisation', icon: isMairie ? Landmark : Building2 },
    { id: 'utilisateurs', label: 'Équipe', icon: Users },
    { id: 'zones', label: 'Zones de collecte', icon: MapPin },
  ] as const

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 animate-pulse h-12" />
        <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Organisation */}
      {tab === 'organisation' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          {/* Type badge */}
          {org && (
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                isMairie
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
              )}>
                {isMairie ? <Landmark size={11} /> : <Building2 size={11} />}
                {isMairie ? 'Mairie — gestion directe' : 'Entreprise délégataire DSP'}
              </span>
            </div>
          )}

          <h3 className="text-sm font-semibold text-gray-900">
            {isMairie ? 'Informations de la mairie' : "Informations de l'organisation"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={isMairie ? 'Nom de la mairie' : 'Nom de la société'}
              value={orgForm.orgName}
              onChange={e => setOrgForm(f => ({ ...f, orgName: e.target.value }))}
              className="col-span-2"
            />
            <Input label="Téléphone" value={orgForm.telephone} onChange={e => setOrgForm(f => ({ ...f, telephone: e.target.value }))} />
            <Input
              label={isMairie ? 'Commune' : 'Commune DSP'}
              value={orgForm.commune}
              onChange={e => setOrgForm(f => ({ ...f, commune: e.target.value }))}
            />
            {isMairie && (
              <Input
                label="Région administrative"
                value={orgForm.region}
                onChange={e => setOrgForm(f => ({ ...f, region: e.target.value }))}
                placeholder="Ex : Région des Plateaux"
              />
            )}
            <Input label="Adresse" value={orgForm.adresse} onChange={e => setOrgForm(f => ({ ...f, adresse: e.target.value }))} className="col-span-2" />
          </div>

          {/* DSP-specific: contrat */}
          {!isMairie && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contrat DSP</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="N° de contrat DSP" value={orgForm.numContrat} onChange={e => setOrgForm(f => ({ ...f, numContrat: e.target.value }))} />
                <Input label="Date du contrat" type="date" value={orgForm.dateContrat} onChange={e => setOrgForm(f => ({ ...f, dateContrat: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Mairie-specific: budget */}
          {isMairie && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Budget déchets</h4>
              <Input
                label="Budget annuel déchets (FCFA)"
                type="number"
                value={orgForm.budgetAnnuel}
                onChange={e => setOrgForm(f => ({ ...f, budgetAnnuel: e.target.value }))}
                placeholder="Ex : 25000000"
              />
            </div>
          )}

          {/* Shared: objectifs */}
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Objectifs opérationnels</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Objectif abonnés" type="number" value={orgForm.objectifAbonnes} onChange={e => setOrgForm(f => ({ ...f, objectifAbonnes: parseInt(e.target.value) || 0 }))} />
              <Input label="Recouvrement (%)" type="number" value={orgForm.objectifRecouvrement} onChange={e => setOrgForm(f => ({ ...f, objectifRecouvrement: parseInt(e.target.value) || 0 }))} />
              <Input label="Collecte (%)" type="number" value={orgForm.objectifCollecte} onChange={e => setOrgForm(f => ({ ...f, objectifCollecte: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>

          {org && (
            <div className="pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
              <span>Slug : <code className="bg-gray-50 px-1 rounded">{org.slug}</code></span>
            </div>
          )}

          <Button variant="primary" onClick={handleSaveOrg} disabled={savingOrg}>
            {savingOrg ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      )}

      {/* Équipe */}
      {tab === 'utilisateurs' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Équipe ({members.length} membres)</h3>
            <p className="text-xs text-gray-400">Les nouveaux membres s'inscrivent via /signup</p>
          </div>
          {members.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">
              <Users size={28} className="mx-auto mb-2 text-gray-200" />
              Invitez votre équipe via le formulaire d'inscription
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Nom</th>
                  <th className="text-left">Rôle</th>
                  <th className="text-left hidden sm:table-cell">Email</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                          {(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm text-gray-900">{m.user.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="text-xs text-gray-600">{ROLE_LABELS[m.role] ?? m.role}</td>
                    <td className="hidden sm:table-cell text-xs text-gray-500">{m.user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Zones */}
      {tab === 'zones' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{zones.length} zones de collecte</h3>
            <Button size="sm" variant="primary" onClick={() => setZoneModal(true)}>
              + Ajouter une zone
            </Button>
          </div>
          {zones.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">
              <MapPin size={28} className="mx-auto mb-2 text-gray-200" />
              Aucune zone configurée
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {zones.map(z => (
                <div key={z.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{z.nom}</div>
                    <div className="text-xs text-gray-500">
                      {z._count.abonnes} abonné(s) · {z.frequenceCollecte === 'bi-hebdomadaire' ? '2× par semaine' : '1× par semaine'}
                    </div>
                  </div>
                  {z.description && <span className="text-xs text-gray-400">{z.description}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal zone */}
      <Modal open={zoneModal} onClose={() => setZoneModal(false)} title="Nouvelle zone de collecte" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setZoneModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleCreateZone} disabled={savingZone}>
              {savingZone ? 'Création…' : 'Créer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nom de la zone" required value={zoneForm.nom} onChange={e => setZoneForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex : Quartier Est" />
          <Input label="Description" value={zoneForm.description} onChange={e => setZoneForm(f => ({ ...f, description: e.target.value }))} placeholder="Délimitation géographique…" />
          <Select label="Fréquence de collecte" value={zoneForm.frequenceCollecte} onChange={e => setZoneForm(f => ({ ...f, frequenceCollecte: e.target.value }))}>
            <option value="bi-hebdomadaire">2 fois par semaine</option>
            <option value="hebdomadaire">1 fois par semaine</option>
          </Select>
        </div>
      </Modal>
    </div>
  )
}
