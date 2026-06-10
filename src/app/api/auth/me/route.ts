export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/middleware'
import prisma from '@/lib/server/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const [user, org, prof] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.userId }, select: { email: true, name: true, emailVerifiedAt: true } }),
    prisma.organization.findUnique({ where: { id: auth.orgId }, select: { name: true, typeOrg: true } }),
    prisma.delegataireProfil.findUnique({ where: { orgId: auth.orgId }, select: { commune: true, objectifAbonnes: true, objectifRecouvrement: true, objectifCollecte: true } }),
  ])

  if (!user || !org) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })

  return NextResponse.json({
    user: {
      id: auth.userId,
      email: user.email,
      name: user.name,
      role: auth.role,
      orgId: auth.orgId,
      orgName: org.name,
      typeOrg: org.typeOrg,
      commune: prof?.commune ?? '',
      objectifAbonnes: prof?.objectifAbonnes ?? 900,
      objectifRecouvrement: prof?.objectifRecouvrement ?? 80,
      objectifCollecte: prof?.objectifCollecte ?? 99,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    },
  })
}
