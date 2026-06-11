export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/middleware'
import prisma from '@/lib/server/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const membres = await prisma.organizationMember.findMany({
    where: { organizationId: auth.orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: 'asc' } },
  })

  return NextResponse.json({ membres })
}
