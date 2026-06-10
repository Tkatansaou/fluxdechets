export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/server/middleware'
import prisma from '@/lib/server/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? ''
  const roleFilter = searchParams.get('role') ?? ''

  const users = await prisma.user.findMany({
    where: {
      ...(search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      emailVerifiedAt: true,
      memberships: {
        select: {
          role: true,
          organization: { select: { id: true, name: true, typeOrg: true } },
        },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      emailVerified: !!u.emailVerifiedAt,
      org: u.memberships[0]?.organization ?? null,
      orgRole: u.memberships[0]?.role ?? null,
    })),
  })
}
