// WasteFlow Service Worker — v3
// Ne cache que les pages statiques, jamais les redirects ou les API

const CACHE_NAME = 'wasteflow-v3'
const STATIC_ASSETS = [
  '/login',
  '/signup',
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
  // Ignorer les requêtes non-http
  if (!event.request.url.startsWith('http')) return

  const url = new URL(event.request.url)

  // Ne jamais intercepter la racine (redirection)
  if (url.pathname === '/') return

  // API → réseau uniquement
  if (url.pathname.startsWith('/api/')) return

  // Images, polices → réseau uniquement (pas de cache pour éviter les conflits)
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf)$/)) return

  // Pages statiques connues → cache-first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request, { redirect: 'follow' }).then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        }).catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }

  // Tout le reste (JS, CSS, Next.js chunks) → network-first avec fallback cache
  event.respondWith(
    fetch(event.request, { redirect: 'follow' }).then((response) => {
      if (response.ok && response.type === 'basic') {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
      }
      return response
    }).catch(() => caches.match(event.request))
  )
})
