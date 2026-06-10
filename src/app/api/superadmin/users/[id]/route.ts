export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const patchSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireSuperAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  // Cannot modify self
  if (id === auth.userId) {
    return NextResponse.json({ error: 'CANNOT_MODIFY_SELF' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const body = patchSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })

  const { status, role } = body.data
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(role ? { role } : {}),
    },
    select: { id: true, email: true, role: true, status: true },
  })

  return NextResponse.json({ user })
}
