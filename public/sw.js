// WasteFlow Service Worker — v4 (cache buster)
// Force le renouvellement complet du cache sur toutes les pages

const CACHE_NAME = 'wasteflow-v4'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Pas de cache — réseau uniquement
  // Le SW sert juste pour la PWA (installable, offline page)
  return
})
