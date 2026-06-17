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
  keywords: [
    'gestion déchets Togo', 'DSP déchets solides', 'logiciel collecte ordures',
    'recouvrement mobile money', 'Tmoney Flooz paiement',
    'délégataire service public', 'WasteFlow',
    'gestion tournées collecte', 'abonnés déchets ménagers',
    'SaaS Afrique Togo',
  ],
  authors: [{ name: 'WasteFlow', url: APP_URL }],
  creator: 'WasteFlow',
  publisher: 'WasteFlow',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: '/',
    languages: { 'fr-TG': '/', 'fr': '/' },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_TG',
    url: APP_URL,
    siteName: 'WasteFlow',
    title: 'WasteFlow — Pilotage DSP Déchets Solides',
    description:
      "Gérez vos abonnés, tournées de collecte et recouvrement mobile money (Tmoney/Flooz) depuis un seul tableau de bord. Conçu pour les délégataires de service public au Togo.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'WasteFlow — Dashboard de pilotage DSP' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WasteFlow — Pilotage DSP Déchets Solides',
    description:
      'Logiciel de gestion des contrats DSP pour les délégataires de collecte de déchets au Togo. Abonnés, tournées, recouvrement Tmoney/Flooz.',
    images: ['/opengraph-image'],
    creator: '@fluxdechets',
  },
  category: 'technology',
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
