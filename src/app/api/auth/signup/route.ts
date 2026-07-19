export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/server/prisma'
import { Prisma } from '@prisma/client'
import { setAuthCookiesOnResponse } from '@/lib/server/auth'
import { logger } from '@/lib/server/logger'
import { checkSignupRateLimit } from '@/lib/server/ratelimit'
import { sendWelcomeEmail } from '@/lib/server/email'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  orgName: z.string().min(2),
  commune: z.string().min(2),
  typeOrg: z.enum(['delegataire', 'mairie']).default('delegataire'),
  numContrat: z.string().optional(),
  region: z.string().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rl = await checkSignupRateLimit(req)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'TOO_MANY_SIGNUP_ATTEMPTS' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues }, { status: 422 })
  }
  const { email, password, nom, prenom, orgName, commune, typeOrg, numContrat, region } = parsed.data

  // Check duplicate
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    // Enumeration-resistant: same 201 response
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36)

  // Create user + organisation + delegataire profile in one transaction
  const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const u = await tx.user.create({
      data: {
        email,
        passwordHash,
        name: `${prenom} ${nom}`,
        emailVerifiedAt: new Date(), // auto-verify for now (add email verification flow later)
      },
    })

    const org = await tx.organization.create({
      data: {
        slug,
        name: orgName,
        ownerId: u.id,
        typeOrg,
        members: {
          create: { userId: u.id, role: 'OWNER' },
        },
      },
    })

    const isDelegataire = typeOrg === 'delegataire'
    await tx.delegataireProfil.create({
      data: {
        orgId: org.id,
        commune,
        region: region || null,
        numContrat: isDelegataire
          ? (numContrat ?? `DSP-${commune.toUpperCase().slice(0, 4)}-${new Date().getFullYear()}`)
          : null,
        dateContrat: isDelegataire ? new Date() : null,
      },
    })

    return { ...u, orgId: org.id }
  })

  logger.info('signup', { userId: user.id, orgName })

  // Send welcome email (non-blocking — failure doesn't break signup)
  sendWelcomeEmail(email, `${prenom} ${nom}`, orgName).catch(() => null)

  const response = NextResponse.json({ ok: true }, { status: 201 })
  await setAuthCookiesOnResponse(
    response,
    user.id, user.email, user.orgId, 'ADMIN', user.tokenVersion,
  )

  return response
}
