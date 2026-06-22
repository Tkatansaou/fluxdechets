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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'WasteFlow',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    "SaaS de pilotage de contrats DSP de collecte des déchets solides municipaux en Afrique de l'Ouest.",
  url: APP_URL,
  offers: {
    '@type': 'Offer',
    price: '50000',
    priceCurrency: 'XOF',
    description: 'Abonnement mensuel délégataire',
  },
  author: {
    '@type': 'Person',
    name: 'Katansaou Tchaa',
    email: 'contact@fluxdechets.com',
    address: { '@type': 'PostalAddress', addressLocality: 'Lomé', addressCountry: 'TG' },
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
