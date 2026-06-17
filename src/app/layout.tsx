import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import Script from 'next/script'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxdechets.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0B6E4F',
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'WasteFlow — Pilotage DSP Déchets Solides au Togo',
    template: '%s | WasteFlow',
  },
  description:
    "Logiciel de pilotage de contrat DSP pour délégataires de collecte de déchets ménagers en Afrique de l'Ouest.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="unregister-sw" strategy="beforeInteractive">
          {`
            if ('serviceWorker' in navigator) {
              // 1. Désenregistrer TOUS les anciens SW
              navigator.serviceWorker.getRegistrations().then(function(regs) {
                for (var i = 0; i < regs.length; i++) {
                  regs[i].unregister()
                }
                // 2. Enregistrer le NOUVEAU SW (v6) — sans fetch handler
                navigator.serviceWorker.register('/sw-v6.js')
              })
              // 3. Vider tous les caches
              if ('caches' in window) {
                caches.keys().then(function(keys) {
                  return Promise.all(keys.map(function(k) { return caches.delete(k) }))
                })
              }
            }
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
