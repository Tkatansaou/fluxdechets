// Battle-tested fetch wrapper — adapted from izikit (faratasn-pixel/izikit)
// Auto-refresh on 401, CSRF auto-attach, idempotent-only network retry.

import { API_URL, COOKIE_PREFIX } from './constants'

const CSRF_COOKIE_NAME = `${COOKIE_PREFIX}-csrf`

export const BACKEND_URL = API_URL

function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null
  const escaped = CSRF_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function storeCsrfToken(token: string): void {
  if (typeof window === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax${secure}`
}

export function clearCsrfToken(): void {
  if (typeof window === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CSRF_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${secure}`
}

let refreshPromise: Promise<boolean> | null = null
const REFRESH_TIMEOUT_MS = 10_000

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS)
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })
      if (res.ok) {
        const data = (await res.json()) as { csrfToken?: string }
        if (data.csrfToken) storeCsrfToken(data.csrfToken)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      clearTimeout(timeoutId)
      refreshPromise = null
    }
  })()
  return refreshPromise
}

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  baseUrl?: string
  _isRetryAfterRefresh?: boolean
}

export type ApiErrorCode =
  | 'TOO_MANY_LOGIN_ATTEMPTS'
  | 'TOO_MANY_SIGNUP_ATTEMPTS'
  | 'TOO_MANY_RESET_REQUESTS'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_SUSPENDED'
  | 'EMAIL_NOT_VERIFIED'
  | 'DUPLICATE_TELEPHONE'
  | 'ABONNE_NOT_FOUND'
  | 'ZONE_NOT_FOUND'
  | 'ENGIN_NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'USER_NOT_FOUND'

export class ApiError extends Error {
  readonly status: number
  readonly body: Record<string, unknown>
  readonly code: ApiErrorCode | (string & {}) | ''

  constructor(status: number, message: string, body?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.body = body ?? {}
    this.code = typeof body?.error === 'string' ? body.error : ''
    this.name = 'ApiError'
  }
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, baseUrl, _isRetryAfterRefresh = false } = options
  const effectiveBaseUrl = baseUrl ?? API_URL

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  if (mutationMethods.includes(method.toUpperCase())) {
    const csrfToken = getCsrfToken()
    if (csrfToken) fetchHeaders['x-csrf-token'] = csrfToken
  }

  const isIdempotent = method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD'
  const MAX_RETRIES = isIdempotent ? 1 : 0
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30_000)

      const init: RequestInit = {
        method,
        headers: fetchHeaders,
        credentials: 'include',
        signal: controller.signal,
      }
      if (body !== undefined) init.body = JSON.stringify(body)

      const response = await fetch(`${effectiveBaseUrl}${path}`, init)
      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401 && !_isRetryAfterRefresh && path !== '/api/auth/refresh') {
          const refreshed = await refreshAccessToken()
          if (refreshed) return api<T>(path, { ...options, _isRetryAfterRefresh: true })
        }

        let errorMessage = `Error ${response.status}`
        let errorBody: Record<string, unknown> = {}
        try {
          const text = await response.text()
          try {
            const json = JSON.parse(text)
            errorBody = json as Record<string, unknown>
            errorMessage = (json as { error?: string }).error ?? errorMessage
          } catch {
            errorMessage =
              response.status >= 500 ? 'Serveur temporairement indisponible' : `Erreur ${response.status}`
          }
        } catch {}
        throw new ApiError(response.status, errorMessage, errorBody)
      }

      return response.json() as Promise<T>
    } catch (err) {
      lastError = err
      if (err instanceof ApiError || attempt >= MAX_RETRIES) {
        if (!(err instanceof ApiError)) {
          const isTimeout = err instanceof DOMException && err.name === 'AbortError'
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
          const message = isTimeout
            ? 'Requête expirée. Vérifiez votre connexion.'
            : isOffline
              ? 'Pas de connexion internet.'
              : 'Erreur réseau. Réessayez.'
          throw new ApiError(0, message)
        }
        throw err
      }
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  throw lastError
}
