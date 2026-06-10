// Apify API client — scraping automatique pour WasteFlow
// Utilise l'API HTTP Apify (indépendant du MCP Claude)

const BASE = 'https://api.apify.com/v2'

export type ApifyRunStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTING' | 'ABORTED'

export interface ApifyRun {
  id: string
  status: ApifyRunStatus
  datasetId: string
  startedAt: string
  finishedAt?: string
}

export interface GoogleMapsResult {
  title: string
  phone?: string
  address?: string
  neighborhood?: string
  street?: string
  city?: string
  categoryName?: string
  totalScore?: number
  reviewsCount?: number
  url?: string
  website?: string
  location?: { lat: number; lng: number }
}

export interface GoogleSearchResult {
  title: string
  url: string
  description?: string
  date?: string
}

function getToken(): string {
  const t = process.env.APIFY_TOKEN
  if (!t) throw new Error('APIFY_TOKEN non configuré')
  return t
}

// Lance un actor et attend la fin (synchrone, max 5 min)
async function runActorSync<T>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
  const token = getToken()
  const res = await fetch(
    `${BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}&format=json`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(300_000),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Apify error ${res.status}: ${err}`)
  }
  return res.json() as Promise<T[]>
}

// Lance un actor en asynchrone — retourne le run ID
export async function startActorRun(
  actorId: string,
  input: Record<string, unknown>
): Promise<ApifyRun> {
  const token = getToken()
  const res = await fetch(`${BASE}/acts/${actorId}/runs?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Apify error ${res.status}`)
  const json = await res.json() as { data: ApifyRun }
  return json.data
}

// Récupère les résultats d'un dataset
export async function getDatasetItems<T>(datasetId: string): Promise<T[]> {
  const token = getToken()
  const res = await fetch(`${BASE}/datasets/${datasetId}/items?token=${token}&format=json`)
  if (!res.ok) throw new Error(`Apify dataset error ${res.status}`)
  return res.json() as Promise<T[]>
}

// ─── Scrapers WasteFlow ──────────────────────────────────────────────────────

// Cherche des abonnés potentiels via Google Maps dans une commune/ville
export async function scrapeGoogleMaps(params: {
  query: string      // ex: "quartier résidentiel Vogan Togo"
  maxItems?: number
}): Promise<GoogleMapsResult[]> {
  return runActorSync<GoogleMapsResult>('apify/google-maps-scraper', {
    searchStringsArray: [params.query],
    maxCrawledPlacesPerSearch: params.maxItems ?? 50,
    language: 'fr',
    country: 'TG',
    exportPlaceUrls: false,
    includeHistogram: false,
    includeOpeningHours: false,
    includePeopleAlsoSearch: false,
    maxImages: 0,
    maxReviews: 0,
  })
}

// Scrape des résultats Google Search (actualités, appels d'offres DSP, etc.)
export async function scrapeGoogleSearch(params: {
  query: string
  maxResults?: number
}): Promise<GoogleSearchResult[]> {
  return runActorSync<GoogleSearchResult>('apify/google-search-scraper', {
    queries: params.query,
    resultsPerPage: params.maxResults ?? 10,
    maxPagesPerQuery: 1,
    languageCode: 'fr',
    countryCode: 'TG',
  })
}

export function isApifyConfigured(): boolean {
  return !!process.env.APIFY_TOKEN
}
