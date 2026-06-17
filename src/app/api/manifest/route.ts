export const runtime = 'nodejs'
import { NextResponse } from 'next/server'

export async function GET() {
  // Manifest minimal — pas de PWA, pas de service worker
  return NextResponse.json({
    name: 'WasteFlow',
    short_name: 'WasteFlow',
    start_url: '/',
    display: 'browser',
    background_color: '#F2F4F0',
    theme_color: '#0B6E4F',
  })
}
