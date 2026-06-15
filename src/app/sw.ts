// WasteFlow Service Worker — cache stratégique offline-first
// Registré depuis le layout principal

const CACHE_NAME = 'wasteflow-v1'
const STATIC_ASSETS = [
  '/',
  '/login',
  '/offline',
]

// ─── Installation : pre-cache les assets statiques ───────────────────────────

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  self.skipWaiting()
})

// ─── Activation : nettoie les anciens caches ─────────────────────────────────

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)),
      ),
    ),
  )
  self.clients.claim()
})

// ─── Fetch : network-first pour les API, cache-first pour les assets ─────────

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // API calls → network only (no cache for dynamic data)
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Static assets → cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })

      return cached ?? fetchPromise
    }),
  )
})

export {} // make TypeScript happy
