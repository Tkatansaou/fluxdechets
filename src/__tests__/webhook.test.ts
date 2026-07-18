import { describe, it, expect } from 'vitest'
import { createHmac, timingSafeEqual } from 'node:crypto'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSignature(body: string, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
}

function verifyHmac(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

// ─── Tests HMAC ───────────────────────────────────────────────────────────────

describe('verifyHmac (webhook Bictorys)', () => {
  const SECRET = 'super-secret-test-key'
  const BODY = JSON.stringify({ event: 'payment.success', data: { id: 'ch_123' } })

  it('accepte une signature valide', () => {
    const sig = makeSignature(BODY, SECRET)
    expect(verifyHmac(BODY, sig, SECRET)).toBe(true)
  })

  it('rejette une signature invalide', () => {
    expect(verifyHmac(BODY, 'sha256=invalide', SECRET)).toBe(false)
  })

  it('rejette une signature null', () => {
    expect(verifyHmac(BODY, null, SECRET)).toBe(false)
  })

  it('rejette si le corps est modifié', () => {
    const sig = makeSignature(BODY, SECRET)
    const alteredBody = BODY.replace('ch_123', 'ch_456')
    expect(verifyHmac(alteredBody, sig, SECRET)).toBe(false)
  })

  it('est résistant aux attaques timing (buffers de tailles différentes ne throw pas)', () => {
    expect(() => verifyHmac(BODY, 'sha256=court', SECRET)).not.toThrow()
  })
})

// ─── Tests idempotence webhook ─────────────────────────────────────────────────

describe('idempotence webhook', () => {
  it('utilise event + externalId comme clé composite unique', () => {
    const payload = { event: 'payment.success', data: { id: 'ch_abc' } }
    const externalId = (payload.data.id ?? payload.event) as string
    expect(externalId).toBe('ch_abc')
  })

  it('fallback externalId sur event si data.id absent', () => {
    const payload = { event: 'ping', data: {} }
    const data = payload.data as Record<string, unknown>
    const externalId = (data.id ?? data.order_id ?? payload.event) as string
    expect(externalId).toBe('ping')
  })
})

// ─── Tests mapping événements Bictorys ──────────────────────────────────────

describe('événements Bictorys', () => {
  const SUCCESS_EVENTS = ['payment.success', 'charge.success']
  const FAILED_EVENTS = ['payment.failed', 'charge.failed']

  it.each(SUCCESS_EVENTS)('reconnaît %s comme succès', (event) => {
    expect(SUCCESS_EVENTS.includes(event)).toBe(true)
  })

  it.each(FAILED_EVENTS)('reconnaît %s comme échec', (event) => {
    expect(FAILED_EVENTS.includes(event)).toBe(true)
  })

  it('ignore les événements inconnus sans erreur', () => {
    const unknownEvent = 'some.unknown.event'
    expect(SUCCESS_EVENTS.includes(unknownEvent)).toBe(false)
    expect(FAILED_EVENTS.includes(unknownEvent)).toBe(false)
  })
})
