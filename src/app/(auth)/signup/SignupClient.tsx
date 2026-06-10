'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Building2, Landmark } from 'lucide-react'
import { api, ApiError, storeCsrfToken } from '@/lib/api'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type OrgType = 'delegataire' | 'mairie'

export default function SignupClient() {
  const router = useRouter()
  const [typeOrg, setTypeOrg] = useState<OrgType>('delegataire')
  const [form, setForm] = useState({
    email: '', password: '', nom: '', prenom: '',
    orgName: '', commune: '', region: '', numContrat: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api<{ ok: boolean; csrfToken?: string }>('/api/auth/signup', {
        method: 'POST',
        body: { ...form, typeOrg },
      })
      if (res.csrfToken) storeCsrfToken(res.csrfToken)
      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau')
      setSubmitting(false)
    }
  }

  const isMairie = typeOrg === 'mairie'

  return (
    <div className="min-h-screen bg-[#F2F4F0] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0B1F16] flex items-center justify-center mb-2">
            <Truck size={18} className="text-brand-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">WasteFlow</h1>
          <p className="text-sm text-gray-500">Créer votre espace de gestion</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Type d'organisation
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'delegataire', label: 'Entreprise délégataire', sub: 'DSP confié par une mairie', icon: Building2 },
                { value: 'mairie', label: 'Mairie', sub: 'Gestion directe des déchets', icon: Landmark },
              ] as const).map(opt => {
                const Icon = opt.icon
                const active = typeOrg === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTypeOrg(opt.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-colors',
                      active
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white',
                    )}
                  >
                    <div className={cn('flex items-center gap-1.5', active ? 'text-brand-700' : 'text-gray-600')}>
                      <Icon size={14} />
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 leading-tight">{opt.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Prénom *</label>
                <input value={form.prenom} onChange={set('prenom')} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Kofi" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Nom *</label>
                <input value={form.nom} onChange={set('nom')} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Mensah" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Email *</label>
              <input type="email" value={form.email} onChange={set('email')} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder={isMairie ? 'contact@mairie-vogan.tg' : 'kofi@stadd-gip.tg'} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Mot de passe (8 caractères min.) *</label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={8} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {isMairie ? 'Votre mairie' : 'Votre organisation'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    {isMairie ? 'Nom de la mairie *' : 'Nom de la société *'}
                  </label>
                  <input
                    value={form.orgName} onChange={set('orgName')} required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder={isMairie ? 'Mairie de Vogan' : 'STADD-GIP-Togo'}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    {isMairie ? 'Commune *' : 'Commune DSP *'}
                  </label>
                  <input
                    value={form.commune} onChange={set('commune')} required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder={isMairie ? 'Vogan' : 'Commune de Vo1 (Vogan)'}
                  />
                </div>
                {isMairie && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Région</label>
                    <input
                      value={form.region} onChange={set('region')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Région des Plateaux"
                    />
                  </div>
                )}
                {!isMairie && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">N° de contrat DSP</label>
                    <input
                      value={form.numContrat} onChange={set('numContrat')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="DSP-VO1-2024-001"
                    />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm py-2.5 rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Création…' : 'Créer mon espace'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-brand-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
