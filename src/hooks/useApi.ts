import { useState, useEffect, useCallback, useRef } from 'react'
import { api, ApiError } from '@/lib/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Hook générique de data-fetching.
 * Évite la duplication du pattern loading/error/data dans chaque page.
 *
 * @example
 * const { data, loading, error, refresh } = useApi<{ abonnes: Abonne[] }>('/api/abonnes')
 */
export function useApi<T>(
  path: string | null,
  deps: unknown[] = [],
): UseApiState<T> & { refresh: () => void } {
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: !!path, error: null })
  const abortRef = useRef<AbortController | null>(null)

  const fetch = useCallback(async () => {
    if (!path) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await api<T>(path)
      setState({ data: res, loading: false, error: null })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof ApiError ? err.message : 'Erreur de chargement'
      setState(s => ({ ...s, loading: false, error: msg }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps])

  useEffect(() => {
    void fetch()
    return () => abortRef.current?.abort()
  }, [fetch])

  return { ...state, refresh: fetch }
}
