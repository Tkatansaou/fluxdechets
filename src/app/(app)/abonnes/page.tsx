'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Search, Download, Upload, Filter, Phone } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { BadgeAbonne } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { cn, formatDate, generateId, generateToken } from '@/lib/utils'
import { STATUT_ABONNE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { Abonne, StatutAbonne, FrequenceCollecte } from '@/types'

type FilterStatut = 'tous' | StatutAbonne
type FilterZone = 'toutes' | string

function PaiementModal({ abonne, onClose }: { abonne: Abonne; onClose: () => void }) {
  const { addPaiement, state } = useApp()
  const [moyen, setMoyen] = useState<'espèces' | 'mobile-money'>('espèces')
  const [operateur, setOperateur] = useState<'tmoney' | 'flooz'>('tmoney')
  const [montant, setMontant] = useState('1000')
  const [loading, setLoading] = useState(false)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const alreadyPaid = state.paiements.some(
    p => p.abonne_id === abonne.id && p.mois_concerne === currentMonth && p.statut === 'validé'
  )

  const handleSubmit = async (e: React.FormEvent) => {
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
      mois_concerne: currentMonth,
    })
    toast.success(`Paiement de ${parseInt(montant).toLocaleString()} FCFA enregistré`)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {alreadyPaid && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-800">
          Cet abonné a déjà un paiement validé pour ce mois.
        </div>
      )}
      <div className="text-sm text-gray-600">
        Abonné : <span className="font-semibold text-gray-900">{abonne.prenom} {abonne.nom}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Mode de paiement"
          value={moyen}
          onChange={e => setMoyen(e.target.value as any)}
        >
          <option value="espèces">Espèces (cash)</option>
          <option value="mobile-money">Mobile Money</option>
        </Select>
        {moyen === 'mobile-money' && (
          <Select
            label="Opérateur"
            value={operateur}
            onChange={e => setOperateur(e.target.value as any)}
          >
            <option value="tmoney">Tmoney</option>
            <option value="flooz">Flooz</option>
          </Select>
        )}
        <Input
          label="Montant (FCFA)"
          type="number"
          value={montant}
          onChange={e => setMontant(e.target.value)}
          min="100"
          required
        />
      </div>
    </form>
  )
}

export default function AbonnesPage() {
  const router = useRouter()
  const { state, importAbonnes } = useApp()
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('tous')
  const [filterZone, setFilterZone] = useState<FilterZone>('toutes')
  const [paiementAbonne, setPaiementAbonne] = useState<Abonne | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importData, setImportData] = useState<{ lignes: string[][]; headers: string[] } | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const abonnes = state.abonnes.filter(a => a.actif && a.statut !== 'inactif' || a.statut === 'inactif')

  const filtered = abonnes.filter(a => {
    const matchSearch = !search || [a.nom, a.prenom, a.telephone, a.adresse]
      .some(f => f.toLowerCase().includes(search.toLowerCase()))
    const matchStatut = filterStatut === 'tous' || a.statut === filterStatut
    const matchZone = filterZone === 'toutes' || a.zone_id === filterZone
    return matchSearch && matchStatut && matchZone
  })

  const stats = {
    total: state.abonnes.filter(a => a.actif).length,
    aJour: state.abonnes.filter(a => a.statut === 'à-jour').length,
    enRetard: state.abonnes.filter(a => a.statut === 'en-retard').length,
    impaye: state.abonnes.filter(a => a.statut === 'impayé').length,
  }

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return
      const headers = lines[0].split(',').map(h => h.trim())
      const lignes = lines.slice(1).map(l => l.split(',').map(c => c.trim()))
      setImportData({ headers, lignes })
      setImportOpen(true)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!importData) return
    setImportLoading(true)
    const { headers, lignes } = importData
    const iNom = headers.findIndex(h => h.toLowerCase().includes('nom'))
    const iPrenom = headers.findIndex(h => h.toLowerCase().includes('prenom') || h.toLowerCase().includes('prénom'))
    const iTel = headers.findIndex(h => h.toLowerCase().includes('tel') || h.toLowerCase().includes('phone'))
    const iAdresse = headers.findIndex(h => h.toLowerCase().includes('adresse'))
    const iZone = headers.findIndex(h => h.toLowerCase().includes('zone'))

    const toImport = lignes.map(l => ({
      nom: l[iNom] ?? '',
      prenom: l[iPrenom] ?? '',
      telephone: l[iTel] ?? '',
      adresse: l[iAdresse] ?? '',
      zone_id: state.zones.find(z => z.nom.toLowerCase().includes((l[iZone] ?? '').toLowerCase()))?.id ?? state.zones[0].id,
      statut: 'impayé' as const,
      frequence_collecte: 'bi-hebdomadaire' as const,
      date_inscription: new Date().toISOString().split('T')[0],
      actif: true,
    })).filter(a => a.nom && a.telephone)

    await new Promise(r => setTimeout(r, 500))
    const count = importAbonnes(toImport)
    toast.success(`${count} abonnés importés avec succès`)
    setImportOpen(false)
    setImportData(null)
    setImportLoading(false)
  }

  const handleExport = () => {
    const csv = [
      ['Nom', 'Prénom', 'Téléphone', 'Adresse', 'Zone', 'Statut', 'Date inscription'].join(','),
      ...filtered.map(a => [
        a.nom, a.prenom, a.telephone, a.adresse,
        state.zones.find(z => z.id === a.zone_id)?.nom ?? '',
        a.statut, a.date_inscription,
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'abonnes-wasteflow.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export CSV téléchargé')
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total actifs', val: stats.total, color: 'text-gray-900' },
          { label: 'À jour', val: stats.aJour, color: 'text-emerald-600' },
          { label: 'En retard', val: stats.enRetard, color: 'text-amber-600' },
          { label: 'Impayés', val: stats.impaye, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
            <div className={cn('text-2xl font-bold tabular-nums', s.color)}>{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher nom, téléphone, adresse…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 h-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value as FilterStatut)}
            className="h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="tous">Tous les statuts</option>
            {Object.entries(STATUT_ABONNE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterZone}
            onChange={e => setFilterZone(e.target.value)}
            className="h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="toutes">Toutes les zones</option>
            {state.zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </select>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="ghost" onClick={handleExport}>
              <Download size={13} /> Export
            </Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={13} /> Importer CSV
            </Button>
            <Button size="sm" variant="primary" onClick={() => router.push('/abonnes/nouveau')}>
              <UserPlus size={13} /> Nouvel abonné
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 text-xs text-gray-500 font-medium">
          {filtered.length} abonné(s) affiché(s)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-dense">
            <thead>
              <tr>
                <th className="text-left">Abonné</th>
                <th className="text-left hidden sm:table-cell">Téléphone</th>
                <th className="text-left hidden md:table-cell">Zone</th>
                <th className="text-left">Statut</th>
                <th className="text-left hidden md:table-cell">Depuis</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const zone = state.zones.find(z => z.id === a.zone_id)
                return (
                  <tr
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/abonnes/${a.id}`)}
                  >
                    <td>
                      <div className="font-medium text-gray-900 text-sm">{a.prenom} {a.nom}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[200px] sm:hidden">{a.telephone}</div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <Phone size={11} className="text-gray-400" />
                        {a.telephone}
                      </span>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="text-gray-600 text-xs">{zone?.nom ?? '—'}</span>
                    </td>
                    <td>
                      <BadgeAbonne statut={a.statut} />
                    </td>
                    <td className="hidden md:table-cell text-xs text-gray-400">
                      {formatDate(a.date_inscription)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPaiementAbonne(a)}
                          className="text-xs"
                        >
                          + Paiement
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">
            Aucun abonné trouvé avec ces critères.
          </div>
        )}
      </div>

      {/* Modal paiement */}
      {paiementAbonne && (
        <Modal
          open
          onClose={() => setPaiementAbonne(null)}
          title={`Enregistrer un paiement — ${paiementAbonne.prenom} ${paiementAbonne.nom}`}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setPaiementAbonne(null)}>Annuler</Button>
              <Button variant="primary" type="submit" form="paiement-form">Enregistrer</Button>
            </>
          }
        >
          <PaiementModalContent abonne={paiementAbonne} onClose={() => setPaiementAbonne(null)} />
        </Modal>
      )}

      {/* Modal import */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportData(null) }}
        title="Importer des abonnés depuis CSV"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleImport} loading={importLoading}>
              Importer {importData?.lignes.length ?? 0} abonnés
            </Button>
          </>
        }
      >
        {importData && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Colonnes détectées : <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                {importData.headers.join(', ')}
              </span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {importData.lignes.length} ligne(s) trouvée(s).
            </p>
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="w-full table-dense">
                <thead>
                  <tr>
                    {importData.headers.map(h => <th key={h} className="text-left">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {importData.lignes.slice(0, 5).map((row, i) => (
                    <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importData.lignes.length > 5 && (
              <p className="text-xs text-gray-400 mt-2">
                + {importData.lignes.length - 5} ligne(s) supplémentaire(s) non affichée(s)
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function PaiementModalContent({ abonne, onClose }: { abonne: Abonne; onClose: () => void }) {
  const { addPaiement, state } = useApp()
  const [moyen, setMoyen] = useState<'espèces' | 'mobile-money'>('espèces')
  const [operateur, setOperateur] = useState<'tmoney' | 'flooz'>('tmoney')
  const [montant, setMontant] = useState('1000')
  const [loading, setLoading] = useState(false)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const handleSubmit = async (e: React.FormEvent) => {
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
      mois_concerne: currentMonth,
    })
    toast.success(`${parseInt(montant).toLocaleString()} FCFA enregistrés pour ${abonne.prenom}`)
    onClose()
  }

  return (
    <form id="paiement-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Mode de paiement" value={moyen} onChange={e => setMoyen(e.target.value as any)}>
          <option value="espèces">Espèces (cash)</option>
          <option value="mobile-money">Mobile Money</option>
        </Select>
        {moyen === 'mobile-money' && (
          <Select label="Opérateur" value={operateur} onChange={e => setOperateur(e.target.value as any)}>
            <option value="tmoney">Tmoney</option>
            <option value="flooz">Flooz</option>
          </Select>
        )}
        <Input
          label="Montant (FCFA)"
          type="number"
          value={montant}
          onChange={e => setMontant(e.target.value)}
          min="100"
          required
        />
      </div>
    </form>
  )
}
