export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const patchSchema = z.object({
  action: z.enum(['suspend-owner', 'activate-owner', 'set-owner-role']),
  role: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = await requireSuperAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, name: true, role: true, status: true, createdAt: true } },
      members: {
        include: { user: { select: { id: true, email: true, name: true, role: true, status: true } } },
      },
      deleProf: {
        include: {
          zones: { include: { _count: { select: { abonnes: { where: { actif: true } } } } } },
          engins: { select: { id: true, statut: true } },
          employes: { select: { id: true, statut: true } },
        },
      },
    },
  })

  if (!org) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ org })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireSuperAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const org = await prisma.organization.findUnique({ where: { id }, select: { ownerId: true } })
  if (!org) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Prevent self-modification of superadmin
  if (org.ownerId === auth.userId) {
    return NextResponse.json({ error: 'CANNOT_MODIFY_SELF' }, { status: 400 })
  }

  const body = patchSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })

  const { action, role } = body.data

  if (action === 'suspend-owner') {
    await prisma.user.update({ where: { id: org.ownerId }, data: { status: 'SUSPENDED' } })
  } else if (action === 'activate-owner') {
    await prisma.user.update({ where: { id: org.ownerId }, data: { status: 'ACTIVE' } })
  } else if (action === 'set-owner-role' && role) {
    await prisma.user.update({ where: { id: org.ownerId }, data: { role } })
  }

  return NextResponse.json({ success: true })
}
