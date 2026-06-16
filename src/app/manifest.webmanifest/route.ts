export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: 'WasteFlow — Pilotage DSP Déchets Solides',
    short_name: 'WasteFlow',
    description:
      'Logiciel de pilotage de contrat DSP pour délégataires de collecte de déchets ménagers au Togo.',
    start_url: '/login',
    display: 'standalone',
    background_color: '#F2F4F0',
    theme_color: '#0B6E4F',
    orientation: 'portrait-primary',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['business', 'utilities'],
    lang: 'fr-TG',
    dir: 'ltr',
  })
  return new NextResponse(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  })
}
