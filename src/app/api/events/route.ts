export const runtime = 'nodejs'
// GET /api/events — Server-Sent Events pour le dashboard temps réel
// Les clients se connectent et recoivent les alertes/KPI en temps réel

import { NextRequest } from 'next/server'
import { getSession } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    start(controller) {
      // Envoie les KPIs initiaux
      const sendEvent = (event: string, data: unknown) => {
        if (closed) return
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      const poll = async () => {
        while (!closed) {
          try {
            const now = new Date()
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

            const [abonnesActifs, engins, tourneesTerminees, tourneesTotal, paiementsRecents] =
              await Promise.all([
                prisma.abonne.count({
                  where: { zone: { orgId: session.orgId }, actif: true, statut: { not: 'inactif' } },
                }),
                prisma.engin.findMany({
                  where: { orgId: session.orgId },
                  select: { statut: true },
                }),
                prisma.tournee.count({
                  where: { zone: { orgId: session.orgId }, statut: 'terminée' },
                }),
                prisma.tournee.count({
                  where: { zone: { orgId: session.orgId }, statut: { not: 'annulée' } },
                }),
                prisma.paiement.findMany({
                  where: { abonne: { zone: { orgId: session.orgId } }, statut: 'validé' },
                  orderBy: { date: 'desc' },
                  take: 5,
                  include: { abonne: { select: { prenom: true, nom: true } } },
                }),
              ])

            const enginsOp = engins.filter(e => e.statut === 'opérationnel').length
            const tauxCollecte = tourneesTotal > 0
              ? Math.round((tourneesTerminees / tourneesTotal) * 100)
              : 100

            sendEvent('kpis', {
              abonnesActifs,
              enginsOperationnels: enginsOp,
              enginsTotal: engins.length,
              tauxCollecte,
              paiementsRecents: paiementsRecents.map(p => ({
                id: p.id,
                montant: p.montant,
                abonne: `${p.abonne.prenom} ${p.abonne.nom}`,
                date: p.date.toISOString(),
              })),
              timestamp: now.toISOString(),
            })
          } catch {
            // Silently continue
          }

          // Poll toutes les 30 secondes
          await new Promise(r => setTimeout(r, 30_000))
        }
      }

      // Envoyer immédiatement puis démarrer le polling
      poll()

      // Keep-alive toutes les 10s
      const keepAlive = setInterval(() => {
        if (closed) { clearInterval(keepAlive); return }
        controller.enqueue(encoder.encode(': keepalive\n\n'))
      }, 10_000)

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(keepAlive)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
