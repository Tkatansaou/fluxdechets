export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/server/auth'

export async function POST(_req: NextRequest): Promise<NextResponse> {
  await clearAuthCookies()
  return NextResponse.json({ ok: true })
}
