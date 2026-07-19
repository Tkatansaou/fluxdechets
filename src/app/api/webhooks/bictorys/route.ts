export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/server/prisma'
import { logger } from '@/lib/server/logger'

const WEBHOOK_SECRET = process.env.BICTORYS_WEBHOOK_SECRET

function verifyHmac(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') return false // must have secret in prod
    return true // dev/simulation mode only
  }
  if (!signature) return false
  const expected = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature = req.headers.get('x-bictorys-signature')

  if (!verifyHmac(rawBody, signature)) {
    if (!WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
      logger.error('bictorys_webhook_secret_missing')
      return NextResponse.json({ error: 'MISCONFIGURED' }, { status: 500 })
    }
    logger.warn('bictorys_webhook_invalid_signature')
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const event = payload.event as string
  const data = payload.data as Record<string, unknown> | undefined

  if (!data) return NextResponse.json({ ok: true }) // unknown event, ack

  // Idempotency: skip already-processed events
  const externalId = (data.id ?? data.order_id ?? event) as string
  const existing = await prisma.webhookLog.findFirst({
    where: { provider: 'bictorys', externalId, eventType: event },
  })
  if (existing?.processedAt) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // Log the webhook
  const jsonPayload = payload as unknown as Prisma.InputJsonValue
  await prisma.webhookLog.upsert({
    where: { provider_externalId_eventType: { provider: 'bictorys', externalId, eventType: event } },
    create: { provider: 'bictorys', externalId, eventType: event, payload: jsonPayload },
    update: { payload: jsonPayload },
  })

  if (event === 'payment.success' || event === 'charge.success') {
    const providerChargeId = (data.id ?? data.charge_id ?? data.transaction_id) as string | undefined
    const meta = data.metadata as Record<string, unknown> | undefined
    const orderId = (data.order_id ?? meta?.order_id) as string | undefined
    const paymentMethod = (data.method ?? data.payment_method) as string | undefined

    // Find the Order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(providerChargeId ? [{ providerChargeId }] : []),
        ],
      },
      include: { paiement: true },
    })

    if (order && order.status !== 'PAID') {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            paymentMethod: paymentMethod ?? order.paymentMethod,
            ...(providerChargeId ? { providerChargeId } : {}),
          },
        }),
        ...(order.paiement
          ? [prisma.paiement.update({
              where: { id: order.paiement.id },
              data: {
                statut: 'validé',
                operateur: paymentMethod?.toLowerCase() as string | undefined,
              },
            }),
            prisma.abonne.updateMany({
              where: { id: order.paiement.abonneId },
              data: { statut: 'à-jour' },
            })]
          : []),
        prisma.webhookLog.update({
          where: { provider_externalId_eventType: { provider: 'bictorys', externalId, eventType: event } },
          data: { processedAt: new Date() },
        }),
      ])

      logger.info('bictorys_payment_confirmed', { orderId: order.id })
    }
  }

  if (event === 'payment.failed' || event === 'charge.failed') {
    const providerChargeId = (data.id ?? data.charge_id) as string | undefined
    const orderId = (data.order_id) as string | undefined

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(providerChargeId ? [{ providerChargeId }] : []),
        ],
      },
      include: { paiement: true },
    })

    if (order && order.status === 'PENDING') {
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } }),
        ...(order.paiement
          ? [prisma.paiement.update({ where: { id: order.paiement.id }, data: { statut: 'échoué' } })]
          : []),
        prisma.webhookLog.update({
          where: { provider_externalId_eventType: { provider: 'bictorys', externalId, eventType: event } },
          data: { processedAt: new Date() },
        }),
      ])
    }
  }

  return NextResponse.json({ ok: true })
}
