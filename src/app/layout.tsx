import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxdechets.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0B6E4F',
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  manifest: '/api/manifest',
  title: {
    default: 'WasteFlow — Pilotage DSP Déchets Solides au Togo',
    template: '%s | WasteFlow',
  },
  description:
    "Logiciel de pilotage de contrat DSP pour délégataires de collecte de déchets ménagers en Afrique de l'Ouest. Gestion des abonnés, tournées, recouvrement Tmoney/Flooz, rapports mairie.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
