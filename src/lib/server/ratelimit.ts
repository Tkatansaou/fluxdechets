import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import type { NextRequest } from 'next/server'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

// In-memory fallback when Upstash is not configured
const inMemoryStore = new Map<string, { count: number; reset: number }>()

function inMemoryCheck(key: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = inMemoryStore.get(key)
  if (!entry || entry.reset < now) {
    inMemoryStore.set(key, { count: 1, reset: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }
  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  return { success: entry.count <= limit, remaining }
}

function makeRedisLimiters() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  return {
    // 10 login attempts per 15 min per IP
    login: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '15m'), prefix: 'rl:login' }),
    // 5 signups per hour per IP
    signup: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1h'), prefix: 'rl:signup' }),
    // 3 password reset requests per hour per IP
    passwordReset: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '1h'), prefix: 'rl:pwd' }),
    // 30 API calls per minute per user
    api: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1m'), prefix: 'rl:api' }),
  }
}

let _limiters: ReturnType<typeof makeRedisLimiters> | null = null

function getLimiters() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  if (!_limiters) _limiters = makeRedisLimiters()
  return _limiters
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  limit: number
}

export async function checkLoginRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const ip = getClientIp(req)
  const limiters = getLimiters()
  if (!limiters) {
    const r = inMemoryCheck(`login:${ip}`, 10, 15 * 60 * 1000)
    return { ...r, limit: 10 }
  }
  const result = await limiters.login.limit(ip)
  return { success: result.success, remaining: result.remaining, limit: result.limit }
}

export async function checkSignupRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const ip = getClientIp(req)
  const limiters = getLimiters()
  if (!limiters) {
    const r = inMemoryCheck(`signup:${ip}`, 5, 60 * 60 * 1000)
    return { ...r, limit: 5 }
  }
  const result = await limiters.signup.limit(ip)
  return { success: result.success, remaining: result.remaining, limit: result.limit }
}

export async function checkPasswordResetRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const ip = getClientIp(req)
  const limiters = getLimiters()
  if (!limiters) {
    const r = inMemoryCheck(`pwd:${ip}`, 3, 60 * 60 * 1000)
    return { ...r, limit: 3 }
  }
  const result = await limiters.passwordReset.limit(ip)
  return { success: result.success, remaining: result.remaining, limit: result.limit }
}

export function isRateLimitConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
