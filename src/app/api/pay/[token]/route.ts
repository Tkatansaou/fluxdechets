export const runtime = 'nodejs'
// Public endpoint — no auth required. Creates a payment order (Moneroo or Bictorys).

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/server/prisma'
import { randomBytes } from 'node:crypto'
import { MONTANT_REDEVANCE } from '@/lib/constants'
import { initMonerooPayment, isMonerooConfigured } from '@/lib/server/moneroo'

const schema = z.object({
  operateur: z.enum(['tmoney', 'flooz', 'moov']),
  telephone: z.string().min(8).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }): Promise<NextResponse> {
  const { token } = await params
  const abonne = await prisma.abonne.findUnique({
    where: { lienPaiementToken: token },
    include: { zone: { include: { org: { include: { org: { select: { name: true } } } } } } },
  })

  if (!abonne || !abonne.actif) {
    return NextResponse.json({ error: 'LIEN_INVALIDE' }, { status: 404 })
  }

  const frais = 110
  return NextResponse.json({
    abonne: {
      prenom: abonne.prenom,
      nom: abonne.nom,
      telephone: abonne.telephone,
      zone: abonne.zone.nom,
      orgName: abonne.zone.org.org.name,
    },
    montant: MONTANT_REDEVANCE,
    frais,
    total: MONTANT_REDEVANCE + frais,
    moisCourant: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    // Inform the client which providers are available
    providers: {
      moneroo: isMonerooConfigured(),
      bictorys: !!process.env.BICTORYS_API_KEY,
    },
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }): Promise<NextResponse> {
  const { token } = await params
  const body = schema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })

  const abonne = await prisma.abonne.findUnique({
    where: { lienPaiementToken: token },
    select: { id: true, prenom: true, nom: true, telephone: true, actif: true },
  })
  if (!abonne || !abonne.actif) {
    return NextResponse.json({ error: 'LIEN_INVALIDE' }, { status: 404 })
  }

  const { operateur } = body.data
  const currentMonth = new Date().toISOString().slice(0, 7)
  const total = MONTANT_REDEVANCE + 110

  // ── Moneroo (priority when configured; required for moov) ──────────────────
  if (isMonerooConfigured()) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const payment = await initMonerooPayment({
        amount: total,
        phone: abonne.telephone,
        firstName: abonne.prenom,
        lastName: abonne.nom,
        operateur,
        description: `Redevance collecte déchets — ${abonne.prenom} ${abonne.nom} — ${currentMonth}`,
        returnUrl: `${appUrl}/pay/${token}?status=success`,
        notificationUrl: `${appUrl}/api/webhooks/moneroo`,
        metadata: { abonneId: abonne.id, moisConcerne: currentMonth },
      })

      const reference = 'WF' + randomBytes(4).toString('hex').toUpperCase()
      const paiement = await prisma.$transaction(async tx => {
        const order = await tx.order.create({
          data: {
            amount: MONTANT_REDEVANCE,
            currency: 'XOF',
            customerPhone: abonne.telephone,
            customerName: `${abonne.prenom} ${abonne.nom}`,
            metadata: { abonneId: abonne.id, moisConcerne: currentMonth },
            provider: 'moneroo',
            providerChargeId: payment.id,
            paymentUrl: payment.checkoutUrl,
            paymentMethod: operateur.toUpperCase(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            status: 'PENDING',
          },
        })

        const p = await tx.paiement.create({
          data: {
            abonneId: abonne.id,
            montant: MONTANT_REDEVANCE,
            moyen: 'mobile-money',
            operateur,
            statut: 'en-attente',
            reference,
            moisConcerne: currentMonth,
            orderId: order.id,
          },
        })
        return p
      })

      return NextResponse.json({
        ok: true,
        provider: 'moneroo',
        checkoutUrl: payment.checkoutUrl,
        reference,
        paiementId: paiement.id,
        statut: 'en-attente',
      })
    } catch (err) {
      console.error('Moneroo error:', err)
      // Fall through to Bictorys or demo
    }
  }

  // ── Bictorys (tmoney/flooz only) ───────────────────────────────────────────
  const bictorysKey = process.env.BICTORYS_API_KEY
  if (bictorysKey && operateur !== 'moov') {
    try {
      const idempotencyKey = `wf-${abonne.id}-${currentMonth}-${randomBytes(4).toString('hex')}`
      const bictorysRes = await fetch('https://api.bictorys.com/v1/charges', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bictorysKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'XOF',
          method: operateur.toUpperCase(),
          phone: abonne.telephone,
          description: `Redevance collecte déchets — ${abonne.prenom} ${abonne.nom} — ${currentMonth}`,
          idempotency_key: idempotencyKey,
          metadata: { abonneId: abonne.id, moisConcerne: currentMonth },
        }),
      })

      if (bictorysRes.ok) {
        const charge = await bictorysRes.json() as { id: string; status: string; payment_url?: string }
        const reference = 'WF' + randomBytes(4).toString('hex').toUpperCase()

        const paiement = await prisma.$transaction(async tx => {
          const order = await tx.order.create({
            data: {
              amount: MONTANT_REDEVANCE,
              currency: 'XOF',
              customerPhone: abonne.telephone,
              customerName: `${abonne.prenom} ${abonne.nom}`,
              metadata: { abonneId: abonne.id, moisConcerne: currentMonth },
              provider: 'bictorys',
              providerChargeId: charge.id,
              paymentUrl: charge.payment_url,
              paymentMethod: operateur.toUpperCase(),
              expiresAt: new Date(Date.now() + 30 * 60 * 1000),
              status: 'PENDING',
            },
          })

          const p = await tx.paiement.create({
            data: {
              abonneId: abonne.id,
              montant: MONTANT_REDEVANCE,
              moyen: 'mobile-money',
              operateur,
              statut: 'en-attente',
              reference,
              moisConcerne: currentMonth,
              orderId: order.id,
            },
          })
          return p
        })

        return NextResponse.json({
          ok: true,
          provider: 'bictorys',
          paymentUrl: charge.payment_url,
          reference,
          paiementId: paiement.id,
          statut: 'en-attente',
        })
      }
    } catch (err) {
      console.error('Bictorys error:', err)
    }
  }

  // ── Demo / simulation mode ─────────────────────────────────────────────────
  await new Promise(r => setTimeout(r, 600))
  const reference = 'WF' + randomBytes(4).toString('hex').toUpperCase()

  await prisma.$transaction(async tx => {
    await tx.paiement.create({
      data: {
        abonneId: abonne.id,
        montant: MONTANT_REDEVANCE,
        moyen: 'mobile-money',
        operateur,
        statut: 'validé',
        reference,
        moisConcerne: currentMonth,
      },
    })
    await tx.abonne.update({ where: { id: abonne.id }, data: { statut: 'à-jour' } })
  })

  return NextResponse.json({ ok: true, provider: 'demo', reference, statut: 'validé' })
}
