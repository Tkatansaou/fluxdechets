'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Search, Download, Upload, Phone } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { BadgeAbonne } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { cn, formatDate } from '@/lib/utils'
import { STATUT_ABONNE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface Zone { id: string; nom: string }
interface Abonne {
  id: string; nom: string; prenom: string; telephone: string
  adresse: string | null; zoneId: string
  zone: { id: string; nom: string }
  statut: string; frequenceCollecte: string
  lienPaiementToken: string; createdAt: string
}

function PaiementModal({ abonne, onClose, onSuccess }: { abonne: Abonne; onClose: () => void; onSuccess: () => void }) {
  const [moyen, setMoyen] = useState<'espèces' | 'mobile-money'>('espèces')
  const [operateur, setOperateur] = useState<'tmoney' | 'flooz'>('tmoney')
  const [montant, setMontant] = useState('1000')
  const [loading, setLoading] = useState(false)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api('/api/paiements', {
        method: 'POST',
        body: {
          abonneId: abonne.id,
          montant: parseInt(montant),
          moyen,
          ...(moyen === 'mobile-money' ? { operateur } : {}),
          moisConcerne: currentMonth,
        },
      })
      toast.success(`Paiement de ${parseInt(montant).toLocaleString()} FCFA enregistré`)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur réseau')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-gray-600">
        Abonné : <span className="font-semibold text-gray-900">{abonne.prenom} {abonne.nom}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Mode de paiement" value={moyen} onChange={e => setMoyen(e.target.value as 'espèces' | 'mobile-money')}>
          <option value="espèces">Espèces (cash)</option>
          <option value="mobile-money">Mobile Money</option>
        </Select>
        {moyen === 'mobile-money' && (
          <Select label="Opérateur" value={operateur} onChange={e => setOperateur(e.target.value as 'tmoney' | 'flooz')}>
            <option value="tmoney">Tmoney</option>
            <option value="flooz">Flooz</option>
          </Select>
        )}
        <Input label="Montant (FCFA)" type="number" value={montant} onChange={e => setMontant(e.target.value)} min="100" required />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>Annuler</Button>
        <Button type="submit" variant="primary" fullWidth loading={loading}>Enregistrer</Button>
      </div>
    </form>
  )
}

export default function AbonnesPage() {
  const router = useRouter()
  const [abonnes, setAbonnes] = useState<Abonne[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterZone, setFilterZone] = useState('toutes')
  const [paiementAbonne, setPaiementAbonne] = useState<Abonne | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importData, setImportData] = useState<{ lignes: string[][]; preview: Abonne[] }>({ lignes: [], preview: [] })
  const [importLoading, setImportLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (filterZone !== 'toutes') params.set('zoneId', filterZone)
      if (filterStatut !== 'tous') params.set('statut', filterStatut)
      const [abData, zoneData] = await Promise.all([
        api<{ abonnes: Abonne[] }>(`/api/abonnes?${params}`),
        zones.length ? Promise.resolve({ zones }) : api<{ zones: Zone[] }>('/api/zones'),
      ])
      setAbonnes(abData.abonnes ?? [])
      if (!zones.length) setZones((zoneData as { zones: Zone[] }).zones ?? [])
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatut, filterZone, zones.length])

  useEffect(() => { load() }, [load])

  const handleExport = () => {
    const header = 'Prénom,Nom,Téléphone,Zone,Statut,Adresse'
    const rows = abonnes.map(a =>
      [a.prenom, a.nom, a.telephone, a.zone.nom, a.statut, a.adresse ?? ''].map(v => `"${v}"`).join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'abonnes.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const lines = text.split('\n').slice(1).map(l => l.split(',').map(v => v.replace(/^"|"$/g, '').trim())).filter(l => l.length >= 3)
      setImportData({ lignes: lines, preview: [] })
      setImportOpen(true)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImport = async () => {
    if (!importData.lignes.length) return
    setImportLoading(true)
    let ok = 0, errs = 0
    for (const l of importData.lignes) {
      const [prenom, nom, telephone, adresse] = l
      const zoneMatch = zones.find(z => z.nom.toLowerCase().includes((l[3] || '').toLowerCase()))
      try {
        await api('/api/abonnes', {
          method: 'POST',
          body: { prenom, nom, telephone, adresse: adresse || '', zoneId: zoneMatch?.id ?? zones[0]?.id ?? '' },
        })
        ok++
      } catch { errs++ }
    }
    toast.success(`${ok} abonnés importés${errs > 0 ? ` (${errs} erreurs)` : ''}`)
    setImportOpen(false)
    setImportLoading(false)
    load()
  }

  const actifs = abonnes.filter(a => a.statut !== 'inactif')
  const aJour = actifs.filter(a => a.statut === 'à-jour').length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total abonnés', val: abonnes.length, color: 'text-gray-900' },
          { label: 'Actifs', val: actifs.length, color: 'text-brand-700' },
          { label: 'À jour', val: aJour, color: 'text-emerald-600' },
          { label: 'Impayés', val: actifs.filter(a => a.statut === 'impayé').length, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <div className={cn('text-2xl font-bold', s.color)}>{s.val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-8 pr-3 h-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="h-8 px-2 border border-gray-300 rounded-md text-xs bg-white focus:outline-none">
          <option value="tous">Tous statuts</option>
          {Object.entries(STATUT_ABONNE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterZone} onChange={e => setFilterZone(e.target.value)}
          className="h-8 px-2 border border-gray-300 rounded-md text-xs bg-white focus:outline-none">
          <option value="toutes">Toutes zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>
        <div className="flex gap-1.5 ml-auto">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileImport} />
          <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}><Upload size={12} /> Import</Button>
          <Button size="sm" variant="ghost" onClick={handleExport}><Download size={12} /> Export</Button>
          <Button size="sm" variant="primary" onClick={() => router.push('/abonnes/nouveau')}><UserPlus size={13} /> Nouvel abonné</Button>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Chargement…</div>
        ) : abonnes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Aucun abonné trouvé.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Abonné</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 hidden sm:table-cell">Zone</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Statut</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 hidden md:table-cell">Inscription</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {abonnes.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/abonnes/${a.id}`)}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{a.prenom} {a.nom}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={10} />{a.telephone}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-600">{a.zone.nom}</td>
                  <td className="px-4 py-3"><BadgeAbonne statut={a.statut as Parameters<typeof BadgeAbonne>[0]['statut']} /></td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setPaiementAbonne(a) }}>
                      Paiement
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal paiement */}
      {paiementAbonne && (
        <Modal open onClose={() => setPaiementAbonne(null)} title="Enregistrer un paiement" size="sm">
          <PaiementModal
            abonne={paiementAbonne}
            onClose={() => setPaiementAbonne(null)}
            onSuccess={() => { setPaiementAbonne(null); load() }}
          />
        </Modal>
      )}

      {/* Modal import CSV */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Importer des abonnés (CSV)" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setImportOpen(false)}>Annuler</Button>
          <Button variant="primary" loading={importLoading} onClick={handleImport} disabled={!importData.lignes.length}>
            Importer {importData.lignes.length} abonnés
          </Button>
        </>}>
        <div className="text-sm text-gray-600 space-y-2">
          <p>Format CSV attendu : <code className="bg-gray-100 px-1 rounded text-xs">Prénom,Nom,Téléphone,Adresse</code></p>
          {importData.lignes.length > 0 && (
            <div className="bg-gray-50 rounded-md p-3 text-xs font-mono max-h-40 overflow-auto">
              {importData.lignes.slice(0, 5).map((l, i) => <div key={i}>{l.join(', ')}</div>)}
              {importData.lignes.length > 5 && <div className="text-gray-400">…et {importData.lignes.length - 5} autres</div>}
            </div>
          )}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">
            La zone sera attribuée automatiquement à la première zone disponible si non précisée.
          </p>
        </div>
      </Modal>
    </div>
  )
}
