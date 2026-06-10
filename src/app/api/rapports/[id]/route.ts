export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const updateSchema = z.object({
  statut: z.enum(['brouillon', 'finalisé']),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const rapport = await prisma.rapport.findFirst({
    where: { id, orgId: auth.orgId },
  })
  if (!rapport) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ rapport })
}

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const existing = await prisma.rapport.findFirst({ where: { id, orgId: auth.orgId } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const body = updateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const rapport = await prisma.rapport.update({
    where: { id },
    data: { statut: body.data.statut },
  })

  return NextResponse.json({ rapport })
}
