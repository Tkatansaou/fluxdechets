export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/middleware'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const input = searchParams.get('input')?.trim()

  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ predictions: [], configured: false })
  }

  try {
    const params = new URLSearchParams({
      input,
      key: apiKey,
      language: 'fr',
      components: 'country:tg',
      types: 'geocode|establishment',
    })
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return NextResponse.json({ predictions: [] })

    const json = await res.json() as {
      status: string
      predictions: Array<{ description: string; place_id: string }>
    }

    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      return NextResponse.json({ predictions: [], error: json.status })
    }

    const predictions = json.predictions.map(p => ({
      label: p.description,
      placeId: p.place_id,
    }))

    return NextResponse.json({ predictions, configured: true })
  } catch {
    return NextResponse.json({ predictions: [] })
  }
}
