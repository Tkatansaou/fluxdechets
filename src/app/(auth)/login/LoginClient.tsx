'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { api, ApiError, storeCsrfToken } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function LoginClient() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [loading, user, router])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api<{ ok: boolean; csrfToken: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      if (res.csrfToken) storeCsrfToken(res.csrfToken)
      router.replace('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case 'INVALID_CREDENTIALS': setError('Email ou mot de passe incorrect.'); break
          case 'ACCOUNT_SUSPENDED': setError('Compte suspendu. Contactez l\'administrateur.'); break
          default: setError(err.message)
        }
      } else {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.')
      }
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F2F4F0]">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2F4F0] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#0B1F16] flex items-center justify-center mb-3">
            <Truck size={22} className="text-brand-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">WasteFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Pilotage DSP — Déchets Solides</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Connexion</h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4" autoComplete="off">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemple@organisation.tg"
                required
                autoComplete="off"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 h-9"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 h-9"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm py-2.5 rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>

            <Link
              href="/forgot-password"
              className="text-xs text-gray-400 hover:text-brand-600 text-center"
            >
              Mot de passe oublié ?
            </Link>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-brand-600 hover:underline">Créer un espace</Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          WasteFlow © 2026 — DSP Déchets Solides
        </p>
      </div>
    </div>
  )
}
