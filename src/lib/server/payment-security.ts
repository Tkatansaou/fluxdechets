import { createHmac, timingSafeEqual } from 'node:crypto'

export function isPaymentSimulationEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV !== 'production' && env.ENABLE_PAYMENT_SIMULATION === 'true'
}

export function verifyWebhookHmac(
  rawBody: string,
  signature: string | null,
  secret: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!secret) return env.NODE_ENV !== 'production'
  if (!signature) return false

  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}
