'use client'

import { useState, useEffect } from 'react'
import { ScanSearch, Search, Globe, UserPlus, AlertCircle, CheckCircle2, ExternalLink, Phone, MapPin } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapingStatus {
  configured: boolean
  availableTypes: string[]
}

interface Prospect {
  nom: string
  telephone: string | null
  adresse: string | null
  source: string
  url?: string
}

interface AbonnesResult {
  commune: string
  quartier: string | null
  prospects: Prospect[]
  count: number
  total_scraped: number
}

interface GoogleSearchResult {
  title: string
  url: string
  description?: string
  date?: string
}

interface Zone {
  id: string
  nom: string
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({
  prospect,
  zones,
  onClose: _onClose,
  onSuccess,
}: {
  prospect: Prospect
  zones: Zone[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    nom: prospect.nom.split(' ').slice(-1)[0] ?? prospect.nom,
    prenom: prospect.nom.split(' ').slice(0, -1).join(' ') || prospect.nom,
    telephone: prospect.telephone ?? '',
    adresse: prospect.adresse ?? '',
    zoneId: zones[0]?.id ?? '',
  })
  const [_loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api('/api/abonnes', {
        method: 'POST',
        body: { ...form, frequenceCollecte: 'bi-hebdomadaire' },
      })
      toast.success(`${form.prenom} ${form.nom} ajouté(e) comme abonné(e)`)
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'ajout'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="import-form" onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-gray-500">Vérifiez et complétez les informations avant d'ajouter cet abonné.</p>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nom"
          value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          required
        />
        <Input
          label="Prénom"
          value={form.prenom}
          onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
          required
        />
      </div>
      <Input
        label="Téléphone"
        value={form.telephone}
        onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
        required
      />
      <Input
        label="Adresse"
        value={form.adresse}
        onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
      />
      <Select
        label="Zone de collecte"
        value={form.zoneId}
        onChange={e => setForm(f => ({ ...f, zoneId: e.target.value }))}
      >
        {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
      </Select>
    </form>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ScrapingPage() {
  const [status, setStatus] = useState<ScrapingStatus | null>(null)
  const [zones, setZones] = useState<Zone[]>([])

  // Formulaire
  const [mode, setMode] = useState<'decouvrir-abonnes' | 'google-search'>('decouvrir-abonnes')
  const [commune, setCommune] = useState('')
  const [quartier, setQuartier] = useState('')
  const [maxItems, setMaxItems] = useState('30')
  const [query, setQuery] = useState('')
  const [maxResults, setMaxResults] = useState('10')

  // Résultats
  const [loading, setLoading] = useState(false)
  const [abonnesResult, setAbonnesResult] = useState<AbonnesResult | null>(null)
  const [searchResults, setSearchResults] = useState<GoogleSearchResult[] | null>(null)
  const [importProspect, setImportProspect] = useState<Prospect | null>(null)
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    api<ScrapingStatus>('/api/scraping').then(setStatus).catch(() => null)
    api<{ zones: Zone[] }>('/api/zones').then(r => setZones(r.zones)).catch(() => null)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAbonnesResult(null)
    setSearchResults(null)
    setImportedIds(new Set())

    try {
      if (mode === 'decouvrir-abonnes') {
        const res = await api<AbonnesResult>('/api/scraping', {
          method: 'POST',
          body: {
            type: 'decouvrir-abonnes',
            commune: commune.trim(),
            quartier: quartier.trim() || undefined,
            maxItems: parseInt(maxItems),
          },
        })
        setAbonnesResult(res)
        if (res.count === 0) toast('Aucun prospect trouvé. Essayez une autre requête.')
        else toast.success(`${res.count} prospect(s) trouvé(s) sur ${res.total_scraped} résultats`)
      } else {
        const res = await api<{ results: GoogleSearchResult[]; count: number }>('/api/scraping', {
          method: 'POST',
          body: {
            type: 'google-search',
            query: query.trim(),
            maxResults: parseInt(maxResults),
          },
        })
        setSearchResults(res.results)
        toast.success(`${res.count} résultat(s) trouvé(s)`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du scraping'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const prospectKey = (p: Prospect) => `${p.nom}|${p.telephone}`

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
          <ScanSearch size={16} className="text-brand-700" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900">Prospection automatique</h1>
          <p className="text-xs text-gray-500">Découvrez des abonnés potentiels ou faites une veille DSP via Google</p>
        </div>
      </div>

      {/* Statut Apify */}
      {status !== null && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs border ${
          status.configured
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {status.configured
            ? <><CheckCircle2 size={13} /> Apify connecté — scraping opérationnel</>
            : <><AlertCircle size={13} /> Apify non configuré — ajoutez <code className="font-mono bg-amber-100 px-1 rounded">APIFY_TOKEN</code> dans <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code></>
          }
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* Sélecteur de mode */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('decouvrir-abonnes')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors ${
              mode === 'decouvrir-abonnes'
                ? 'border-brand-600 bg-brand-50 text-brand-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserPlus size={14} /> Découvrir des abonnés
          </button>
          <button
            type="button"
            onClick={() => setMode('google-search')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors ${
              mode === 'google-search'
                ? 'border-brand-600 bg-brand-50 text-brand-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe size={14} /> Veille Google
          </button>
        </div>

        {mode === 'decouvrir-abonnes' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input
              label="Commune *"
              placeholder="ex: Vogan"
              value={commune}
              onChange={e => setCommune(e.target.value)}
              required
            />
            <Input
              label="Quartier (optionnel)"
              placeholder="ex: Quartier Marché"
              value={quartier}
              onChange={e => setQuartier(e.target.value)}
            />
            <Select
              label="Max résultats"
              value={maxItems}
              onChange={e => setMaxItems(e.target.value)}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Requête Google *"
                placeholder="ex: appel d'offres DSP déchets Togo 2026"
                value={query}
                onChange={e => setQuery(e.target.value)}
                required
              />
            </div>
            <Select
              label="Nb résultats"
              value={maxResults}
              onChange={e => setMaxResults(e.target.value)}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">
            {mode === 'decouvrir-abonnes'
              ? 'Recherche via Google Maps — résultats résidentiels/commerciaux au Togo'
              : 'Résultats Google Search — filtrés sur le Togo (fr)'}
          </p>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
            disabled={!status?.configured}
          >
            <Search size={13} />
            {loading ? 'Recherche en cours…' : 'Lancer la recherche'}
          </Button>
        </div>
      </form>

      {/* Résultats — prospects abonnés */}
      {abonnesResult && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">
                {abonnesResult.count} prospect(s) — {abonnesResult.commune}
                {abonnesResult.quartier ? ` · ${abonnesResult.quartier}` : ''}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                ({abonnesResult.total_scraped} résultats Google Maps analysés)
              </span>
            </div>
          </div>

          {abonnesResult.prospects.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Aucun prospect avec téléphone ou adresse disponible.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-dense">
                <thead>
                  <tr>
                    <th className="text-left">Nom / Établissement</th>
                    <th className="text-left hidden sm:table-cell">Téléphone</th>
                    <th className="text-left hidden md:table-cell">Adresse</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {abonnesResult.prospects.map(p => {
                    const key = prospectKey(p)
                    const imported = importedIds.has(key)
                    return (
                      <tr key={key}>
                        <td>
                          <div className="font-medium text-gray-900 text-sm">{p.nom}</div>
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink size={10} /> Voir sur Maps
                            </a>
                          )}
                        </td>
                        <td className="hidden sm:table-cell">
                          {p.telephone ? (
                            <span className="flex items-center gap-1.5 text-gray-700 text-sm">
                              <Phone size={11} className="text-gray-400" />
                              {p.telephone}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="hidden md:table-cell">
                          {p.adresse ? (
                            <span className="flex items-center gap-1 text-gray-600 text-xs">
                              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{p.adresse}</span>
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="text-right">
                          {imported ? (
                            <span className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                              <CheckCircle2 size={12} /> Ajouté
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setImportProspect(p)}
                              className="text-xs"
                            >
                              <UserPlus size={12} /> Ajouter
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Résultats — veille Google */}
      {searchResults && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-900">
              {searchResults.length} résultat(s) Google Search
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Aucun résultat.</div>
            ) : (
              searchResults.map((r, i) => (
                <div key={i} className="px-4 py-3">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand-700 hover:underline flex items-center gap-1.5"
                  >
                    {r.title}
                    <ExternalLink size={11} className="flex-shrink-0 text-gray-400" />
                  </a>
                  {r.date && (
                    <p className="text-xs text-gray-400 mt-0.5">{r.date}</p>
                  )}
                  {r.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>
                  )}
                  <p className="text-xs text-gray-300 truncate mt-0.5">{r.url}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal import prospect → abonné */}
      {importProspect && (
        <Modal
          open
          onClose={() => setImportProspect(null)}
          title="Ajouter comme abonné"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setImportProspect(null)}>Annuler</Button>
              <Button variant="primary" type="submit" form="import-form">
                <UserPlus size={13} /> Ajouter l'abonné
              </Button>
            </>
          }
        >
          <ImportModal
            prospect={importProspect}
            zones={zones}
            onClose={() => setImportProspect(null)}
            onSuccess={() => {
              setImportedIds(prev => new Set([...prev, prospectKey(importProspect)]))
              setImportProspect(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}
