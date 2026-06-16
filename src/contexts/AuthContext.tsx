'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError, clearCsrfToken, storeCsrfToken } from '@/lib/api'
import { COOKIE_PREFIX } from '@/lib/constants'

export interface CurrentUser {
  id: string
  email: string
  name: string | null
  role: string
  orgId: string
  orgName: string
  typeOrg: string  // 'delegataire' | 'mairie'
  commune: string
  objectifAbonnes: number
  objectifRecouvrement: number
  objectifCollecte: number
  emailVerifiedAt: string | null
}

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  loggingOut: boolean
  error: string | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    setError(null)
    try {
      const res = await api<{ user: CurrentUser; csrfToken?: string }>('/api/auth/me')
      setUser(res.user)
      if (res.csrfToken) storeCsrfToken(res.csrfToken)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
        clearCsrfToken() // cookies côté serveur nettoyés par /api/auth/refresh
      } else if (err instanceof ApiError && err.status === 429) {
        setError('Trop de requêtes. Attendez quelques minutes.')
      } else {
        const msg = err instanceof Error ? err.message : 'Impossible de joindre le serveur.'
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const csrfCookieName = `${COOKIE_PREFIX}-csrf`
    const hasCookie = document.cookie
      .split(';')
      .some(c => c.trim().startsWith(`${csrfCookieName}=`))
    if (!hasCookie) {
      setLoading(false)
      return
    }
    void fetchUser()
  }, [fetchUser])

  const logout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch { /* logout graceful — on nettoie quand même */ }
    clearCsrfToken()
    setUser(null)
    setLoggingOut(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, loggingOut, error, refresh: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

const SSR_STUB: AuthContextValue = {
  user: null,
  loading: true,
  loggingOut: false,
  error: null,
  refresh: async () => {},
  logout: async () => {},
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    if (typeof window === 'undefined') return SSR_STUB
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}

export function useUser(redirectTo = '/login'): CurrentUser | null {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace(redirectTo)
  }, [loading, user, redirectTo, router])

  if (loading || !user) return null
  return user
}
