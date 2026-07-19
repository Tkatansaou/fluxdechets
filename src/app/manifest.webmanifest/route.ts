import { NextResponse } from 'next/server'

const manifest = {
  name: 'fluxdechets.com — Gestion des déchets',
  short_name: 'fluxdechets.com',
  description: 'Pilotage des opérations de collecte et de recouvrement.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#F2F4F0',
  theme_color: '#0B6E4F',
  lang: 'fr',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
