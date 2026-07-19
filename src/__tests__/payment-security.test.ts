import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { isPaymentSimulationEnabled, verifyWebhookHmac } from '@/lib/server/payment-security'

describe('payment production safety', () => {
  it('never enables simulated payments in production', () => {
    expect(isPaymentSimulationEnabled({
      NODE_ENV: 'production',
      ENABLE_PAYMENT_SIMULATION: 'true',
    })).toBe(false)
  })

  it('requires explicit opt-in outside production', () => {
    expect(isPaymentSimulationEnabled({ NODE_ENV: 'development' })).toBe(false)
    expect(isPaymentSimulationEnabled({
      NODE_ENV: 'development',
      ENABLE_PAYMENT_SIMULATION: 'true',
    })).toBe(true)
  })

  it('rejects unsigned webhooks in production when the secret is missing', () => {
    expect(verifyWebhookHmac('{}', null, undefined, { NODE_ENV: 'production' })).toBe(false)
  })

  it('accepts only the correct HMAC when a secret is configured', () => {
    const body = JSON.stringify({ event: 'payment.success' })
    const secret = 'test-secret'
    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`

    expect(verifyWebhookHmac(body, signature, secret, { NODE_ENV: 'production' })).toBe(true)
    expect(verifyWebhookHmac(`${body}x`, signature, secret, { NODE_ENV: 'production' })).toBe(false)
  })
})
