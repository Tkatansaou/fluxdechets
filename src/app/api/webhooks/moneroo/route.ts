export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/server/prisma'
import { logger } from '@/lib/server/logger'

const WEBHOOK_SECRET = process.env.MONEROO_WEBHOOK_SECRET

function verifyHmac(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) return true // simulation mode: skip verification
  if (!signature) return false
  // Moneroo sends: sha256=<hex>
  const expected = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
  return signature === expected
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature = req.headers.get('x-moneroo-signature')

  if (!verifyHmac(rawBody, signature)) {
    logger.warn('moneroo_webhook_invalid_signature')
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

  if (!data) return NextResponse.json({ ok: true })

  // Idempotency
  const externalId = (data.id ?? data.payment_id ?? event) as string
  const existing = await prisma.webhookLog.findFirst({
    where: { provider: 'moneroo', externalId, eventType: event },
  })
  if (existing?.processedAt) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const jsonPayload = payload as unknown as Prisma.InputJsonValue
  await prisma.webhookLog.upsert({
    where: { externalId_eventType: { externalId, eventType: event } },
    create: { provider: 'moneroo', externalId, eventType: event, payload: jsonPayload },
    update: { payload: jsonPayload },
  })

  if (event === 'payment.success') {
    const providerChargeId = (data.id ?? data.payment_id) as string | undefined
    const meta = data.metadata as Record<string, unknown> | undefined
    const orderId = (data.order_id ?? meta?.order_id) as string | undefined
    const paymentMethod = (data.payment_method ?? data.method) as string | undefined

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
      // Map Moneroo method back to operator label
      const operateurMap: Record<string, string> = {
        tg_tmoney: 'tmoney',
        tg_flooz: 'flooz',
        tg_moov_money: 'moov',
      }
      const operateur = paymentMethod ? (operateurMap[paymentMethod] ?? paymentMethod) : undefined

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
          ? [
              prisma.paiement.update({
                where: { id: order.paiement.id },
                data: { statut: 'validé', operateur },
              }),
              prisma.abonne.updateMany({
                where: { id: order.paiement.abonneId },
                data: { statut: 'à-jour' },
              }),
            ]
          : []),
        prisma.webhookLog.update({
          where: { externalId_eventType: { externalId, eventType: event } },
          data: { processedAt: new Date() },
        }),
      ])

      logger.info('moneroo_payment_confirmed', { orderId: order.id })
    }
  }

  if (event === 'payment.failed') {
    const providerChargeId = (data.id ?? data.payment_id) as string | undefined
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
          where: { externalId_eventType: { externalId, eventType: event } },
          data: { processedAt: new Date() },
        }),
      ])
    }
  }

  return NextResponse.json({ ok: true })
}
