export const runtime = 'nodejs'
// POST /api/cron/payment-reminders — déclenché via cron job
// Envoie des rappels de paiement aux abonnés en retard

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/server/prisma'
import { sendPaymentReminderEmail } from '@/lib/server/email'
import { logger } from '@/lib/server/logger'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Authentification via CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const currentMonth = new Date().toISOString().slice(0, 7)

  // Trouver tous les abonnés en retard qui n'ont pas encore payé ce mois
  const abonnesEnRetard = await prisma.abonne.findMany({
    where: {
      statut: { in: ['en-retard', 'impayé'] },
      actif: true,
      zone: {
        org: {
          paygateApiKey: { not: null }, // seulement ceux avec un compte payant configuré
        },
      },
    },
    include: {
      zone: {
        include: {
          org: {
            select: { commune: true },
          },
        },
      },
    },
    take: 500,
  })

  let sent = 0
  let errors = 0

  for (const abonne of abonnesEnRetard) {
    if (!abonne.telephone) continue

    try {
      await sendPaymentReminderEmail(
        abonne.telephone,
        `${abonne.prenom} ${abonne.nom}`,
        currentMonth,
        1000,
      )
      sent++
    } catch {
      errors++
    }
  }

  logger.info('payment_reminders_cron', { sent, errors, month: currentMonth })

  return NextResponse.json({
    ok: true,
    sent,
    errors,
    month: currentMonth,
  })
}
