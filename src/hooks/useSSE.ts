// ─── Hook SSE pour dashboard temps réel ──────────────────────────────────────

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface SseKpis {
  abonnesActifs: number
  enginsOperationnels: number
  enginsTotal: number
  tauxCollecte: number
  paiementsRecents: {
    id: string
    montant: number
    abonne: string
    date: string
  }[]
  timestamp: string
}

export function useSSE(enabled = true) {
  const [kpis, setKpis] = useState<SseKpis | null>(null)
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return

    const es = new EventSource('/api/events')
    eventSourceRef.current = es

    es.onopen = () => setConnected(true)

    es.addEventListener('kpis', (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as SseKpis
        setKpis(data)
      } catch { /* ignore parse errors */ }
    })

    es.onerror = () => {
      setConnected(false)
      es.close()
      eventSourceRef.current = null

      // Auto-reconnect après 5 secondes
      reconnectTimeoutRef.current = setTimeout(connect, 5_000)
    }
  }, [enabled])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
  }, [])

  useEffect(() => {
    connect()
    return disconnect
  }, [connect, disconnect])

  return { kpis, connected }
}
