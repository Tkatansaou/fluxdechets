export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import { scrapeGoogleMaps, scrapeGoogleSearch, isApifyConfigured } from '@/lib/server/apify'
import type { GoogleMapsResult } from '@/lib/server/apify'

const schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('google-maps'),
    query: z.string().min(3),
    maxItems: z.number().int().min(1).max(200).default(50),
  }),
  z.object({
    type: z.literal('google-search'),
    query: z.string().min(3),
    maxResults: z.number().int().min(1).max(50).default(10),
  }),
  z.object({
    type: z.literal('decouvrir-abonnes'),
    commune: z.string().min(2),
    quartier: z.string().optional(),
    maxItems: z.number().int().min(1).max(100).default(30),
  }),
])

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  return NextResponse.json({
    configured: isApifyConfigured(),
    availableTypes: ['google-maps', 'google-search', 'decouvrir-abonnes'],
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  // Seuls les admins peuvent lancer des scrapes (coût Apify)
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  if (!isApifyConfigured()) {
    return NextResponse.json(
      { error: 'APIFY_NOT_CONFIGURED', message: 'APIFY_TOKEN non configuré dans les variables d\'environnement' },
      { status: 503 }
    )
  }

  const body = schema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })
  }

  try {
    switch (body.data.type) {
      case 'google-maps': {
        const results = await scrapeGoogleMaps({
          query: body.data.query,
          maxItems: body.data.maxItems,
        })
        return NextResponse.json({ results, count: results.length })
      }

      case 'google-search': {
        const results = await scrapeGoogleSearch({
          query: body.data.query,
          maxResults: body.data.maxResults,
        })
        return NextResponse.json({ results, count: results.length })
      }

      case 'decouvrir-abonnes': {
        // Cherche des résidents/ménages dans la commune ciblée
        const { commune, quartier, maxItems } = body.data
        const q = quartier
          ? `${quartier} ${commune} Togo résidentiel`
          : `${commune} Togo quartier résidentiel ménages`

        const raw = await scrapeGoogleMaps({ query: q, maxItems })

        // Filtre et transforme en format abonnés potentiels
        const prospects = raw
          .filter((r: GoogleMapsResult) => r.phone || r.address)
          .map((r: GoogleMapsResult) => ({
            nom: r.title,
            telephone: r.phone ?? null,
            adresse: [r.street, r.neighborhood, r.city].filter(Boolean).join(', ') || r.address,
            source: 'apify-google-maps',
            url: r.url,
          }))

        return NextResponse.json({
          commune,
          quartier: quartier ?? null,
          prospects,
          count: prospects.length,
          total_scraped: raw.length,
        })
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'SCRAPING_ERROR', message }, { status: 500 })
  }
}
