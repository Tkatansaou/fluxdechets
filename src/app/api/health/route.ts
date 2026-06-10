export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import prisma from '@/lib/server/prisma'

export async function GET(): Promise<NextResponse> {
  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {}

  const ok = dbOk
  return NextResponse.json({ ok, db: dbOk, time: new Date().toISOString() }, { status: ok ? 200 : 503 })
}
