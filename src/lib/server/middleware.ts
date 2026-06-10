import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './auth'
import prisma from './prisma'

export interface AuthContext {
  userId: string
  email: string
  orgId: string
  role: string
}

/**
 * Require authenticated session. Returns the AuthContext or a 401 NextResponse.
 * Usage:
 *   const auth = await requireAuth(req)
 *   if (auth instanceof NextResponse) return auth
 *   // auth.userId, auth.orgId, auth.role available
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext | NextResponse> {
  const session = await getSession(req)
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Verify user still exists and not suspended
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { status: true, tokenVersion: true },
  })

  if (!user || user.status === 'SUSPENDED') {
    return NextResponse.json({ error: 'ACCOUNT_SUSPENDED' }, { status: 403 })
  }

  if (user.tokenVersion !== session.tv) {
    return NextResponse.json({ error: 'SESSION_REVOKED' }, { status: 401 })
  }

  return {
    userId: session.sub,
    email: session.email,
    orgId: session.orgId,
    role: session.role,
  }
}

/**
 * Require authenticated session + ADMIN or SUPERADMIN role.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth
  if (auth.role !== 'ADMIN' && auth.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  return auth
}

/**
 * Require authenticated session + SUPERADMIN role (platform owner only).
 * Re-checks role from DB on every request — JWT role alone is not trusted for this privilege level.
 */
export async function requireSuperAdmin(req: NextRequest): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  // Re-read role from DB to ensure immediate effect of any demotion
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  })

  if (user?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  return { ...auth, role: 'SUPERADMIN' }
}

/**
 * Check if the authenticated user belongs to an organisation with the given org membership.
 * Returns the orgId or a 404 (not 403 — don't leak org existence to non-members).
 */
export async function requireOrgAccess(
  req: NextRequest,
  orgId: string,
): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  if (auth.orgId !== orgId) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  return auth
}

/**
 * Get the DelegataireProfil for the current authenticated user's organisation.
 * Returns the profile or a 404 if not found.
 */
export async function getOrgProfile(orgId: string) {
  return prisma.delegataireProfil.findUnique({ where: { orgId } })
}
