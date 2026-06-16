import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

function getJwtSecret(): Uint8Array {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required — set it in .env.local')
  }
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

const COOKIE_PREFIX = process.env.NEXT_PUBLIC_COOKIE_PREFIX ?? 'wf'
const ACCESS_COOKIE = `${COOKIE_PREFIX}-access`
const REFRESH_COOKIE = `${COOKIE_PREFIX}-refresh`
const CSRF_COOKIE = `${COOKIE_PREFIX}-csrf`

const IS_PROD = process.env.NODE_ENV === 'production'

const ACCESS_TTL = 15 * 60       // 15 min
const REFRESH_TTL = 7 * 24 * 3600 // 7 days
const CSRF_TTL = 7 * 24 * 3600

export interface JwtPayload {
  sub: string       // userId
  email: string
  orgId: string     // Organization ID
  role: string      // USER | ADMIN | SUPERADMIN
  tv: number        // tokenVersion
  type: 'access' | 'refresh'
}

export async function signAccessToken(payload: Omit<JwtPayload, 'type'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL}s`)
    .sign(getJwtSecret())
}

export async function signRefreshToken(payload: Omit<JwtPayload, 'type'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL}s`)
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

type CookieOpts = {
  maxAge: number
  path: string
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
}

function cookieOpts(maxAge: number, path = '/'): CookieOpts {
  return { maxAge, path, httpOnly: true, secure: IS_PROD, sameSite: 'lax' }
}

export async function issueAuthCookies(
  userId: string,
  email: string,
  orgId: string,
  role: string,
  tokenVersion: number,
): Promise<{ csrfToken: string }> {
  const base: Omit<JwtPayload, 'type'> = { sub: userId, email, orgId, role, tv: tokenVersion }
  const [access, refresh] = await Promise.all([signAccessToken(base), signRefreshToken(base)])
  const csrfToken = randomBytes(32).toString('hex')

  const jar = await cookies()
  jar.set(ACCESS_COOKIE, access, cookieOpts(ACCESS_TTL))
  jar.set(REFRESH_COOKIE, refresh, cookieOpts(REFRESH_TTL, '/api/auth'))
  jar.set(CSRF_COOKIE, csrfToken, { ...cookieOpts(CSRF_TTL), httpOnly: false })

  return { csrfToken }
}

/** Version compatible avec Next.js 16 — set cookies directly on a NextResponse */
export async function setAuthCookiesOnResponse(
  response: NextResponse,
  userId: string,
  email: string,
  orgId: string,
  role: string,
  tokenVersion: number,
): Promise<{ csrfToken: string }> {
  const base: Omit<JwtPayload, 'type'> = { sub: userId, email, orgId, role, tv: tokenVersion }
  const [access, refresh] = await Promise.all([signAccessToken(base), signRefreshToken(base)])
  const csrfToken = randomBytes(32).toString('hex')

  response.cookies.set(ACCESS_COOKIE, access, cookieOpts(ACCESS_TTL))
  response.cookies.set(REFRESH_COOKIE, refresh, cookieOpts(REFRESH_TTL, '/api/auth'))
  response.cookies.set(CSRF_COOKIE, csrfToken, { ...cookieOpts(CSRF_TTL), httpOnly: false })

  return { csrfToken }
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies()
  jar.delete(ACCESS_COOKIE)
  jar.delete(REFRESH_COOKIE)
  jar.delete(CSRF_COOKIE)
}

export async function getSession(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get(ACCESS_COOKIE)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.type !== 'access') return null
  return payload
}

export function verifyCsrf(req: NextRequest): NextResponse | null {
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  if (!mutationMethods.includes(req.method)) return null

  const headerToken = req.headers.get('x-csrf-token')
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return NextResponse.json({ error: 'CSRF_INVALID' }, { status: 403 })
  }
  return null
}

// ─── Encryption (for sensitive fields like API keys) ─────────────────────────

const ENC_KEY_B64 = process.env.ENCRYPTION_KEY ?? '' // lazy: checked in getEncKey()

function getEncKey(): Buffer {
  if (!ENC_KEY_B64) throw new Error('ENCRYPTION_KEY env var missing')
  return Buffer.from(ENC_KEY_B64, 'base64')
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}.${encrypted.toString('hex')}.${tag.toString('hex')}`
}

export function decrypt(ciphertext: string): string {
  const [ivHex, encHex, tagHex] = ciphertext.split('.')
  if (!ivHex || !encHex || !tagHex) throw new Error('Invalid ciphertext format')
  const decipher = createDecipheriv('aes-256-gcm', getEncKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return decipher.update(Buffer.from(encHex, 'hex')).toString('utf8') + decipher.final('utf8')
}
