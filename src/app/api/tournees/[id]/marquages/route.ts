export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const marquageSchema = z.object({
  abonneId: z.string().cuid(),
  statut: z.enum(['effectué', 'non-effectué']),
  motif: z.enum(['accès-bloqué', 'bac-absent', 'panne-engin', 'autre']).optional(),
  motifDetail: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const body = marquageSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const tournee = await prisma.tournee.findFirst({ where: { id, zone: { orgId: auth.orgId } } })
  if (!tournee) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const marquage = await prisma.marquage.upsert({
    where: { tourneeId_abonneId: { tourneeId: id, abonneId: body.data.abonneId } },
    create: {
      tourneeId: id,
      abonneId: body.data.abonneId,
      statut: body.data.statut,
      motif: body.data.motif,
      motifDetail: body.data.motifDetail,
      heureMarquage: new Date(),
    },
    update: {
      statut: body.data.statut,
      motif: body.data.motif,
      motifDetail: body.data.motifDetail,
      heureMarquage: new Date(),
    },
  })

  // Auto-passe la tournée à en-cours si elle était planifiée
  if (tournee.statut === 'planifiée') {
    await prisma.tournee.update({ where: { id }, data: { statut: 'en-cours' } })
  }

  return NextResponse.json({ marquage }, { status: 201 })
}
