'use client'

import { useEffect } from 'react'

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Étape 1 : Désenregistrer TOUS les anciens SW
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          reg.unregister()
        }
      })

      // Étape 2 : Vider tous les caches
      if ('caches' in window) {
        caches.keys().then((keys) =>
          Promise.all(keys.map((k) => caches.delete(k)))
        )
      }

      // Étape 3 : Enregistrer le nouveau SW (nom différent = pas de cache)
      navigator.serviceWorker.register('/sw-v5.js').catch(() => {
        // silent
      })
    }
  }, [])

  return null
}
