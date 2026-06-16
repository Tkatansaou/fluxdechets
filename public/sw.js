// WasteFlow Service Worker — v2
// Ne cache que les requêtes http/https (ignore les extensions chrome://)

const CACHE_NAME = 'wasteflow-v2'
const STATIC_ASSETS = [
  '/',
  '/login',
  '/offline',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-http (chrome-extension://, data:, etc.)
  if (!event.request.url.startsWith('http')) return

  const url = new URL(event.request.url)

  // API → réseau uniquement
  if (url.pathname.startsWith('/api/')) return

  // Assets statiques → cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})
