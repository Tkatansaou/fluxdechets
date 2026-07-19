export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies, verifyCsrf } from '@/lib/server/auth'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf
  await clearAuthCookies()
  return NextResponse.json({ ok: true })
}
