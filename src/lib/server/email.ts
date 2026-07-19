import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = process.env.EMAIL_FROM ?? 'fluxdechets.com <noreply@fluxdechets.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxdechets.com'

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

interface SendResult {
  ok: boolean
  id?: string
  error?: string
}

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non configuré — email non envoyé:', subject)
    return { ok: false, error: 'RESEND_NOT_CONFIGURED' }
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f4f7f6; }
  .wrap { max-width:560px; margin:32px auto; background:#fff; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0; }
  .header { background:#0B1F16; padding:24px 32px; }
  .logo { color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; gap:8px; }
  .logo span { color:#4ade80; }
  .body { padding:32px; color:#374151; font-size:14px; line-height:1.6; }
  .body h1 { font-size:20px; color:#111827; margin-top:0; }
  .btn { display:inline-block; padding:12px 24px; background:#0B6E4F; color:#fff!important; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px; margin:16px 0; }
  .info-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:12px 16px; margin:16px 0; font-size:13px; }
  .footer { padding:16px 32px; border-top:1px solid #e5e7eb; font-size:11px; color:#9ca3af; text-align:center; }
</style></head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">Waste<span>Flow</span></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">fluxdechets.com — Pilotage DSP Déchets Solides · Togo<br>
      Vous recevez cet email car vous avez un compte sur ${APP_URL}
    </div>
  </div>
</body></html>`
}

// ─── Emails métier ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, orgName: string): Promise<SendResult> {
  return send(
    to,
    `Bienvenue sur fluxdechets.com, ${name} !`,
    base(`
      <h1>Bienvenue, ${name} 👋</h1>
      <p>Votre organisation <strong>${orgName}</strong> est maintenant active sur fluxdechets.com.</p>
      <p>Commencez par configurer vos zones de collecte et ajouter vos premiers abonnés.</p>
      <a href="${APP_URL}/dashboard" class="btn">Accéder au tableau de bord</a>
      <div class="info-box">
        <strong>Votre identifiant de connexion :</strong> ${to}
      </div>
      <p style="font-size:12px;color:#6b7280;">Si vous n'avez pas créé ce compte, ignorez cet email.</p>
    `)
  )
}

export async function sendVerificationEmail(to: string, name: string, code: string): Promise<SendResult> {
  return send(
    to,
    'Vérifiez votre adresse email — fluxdechets.com',
    base(`
      <h1>Vérification de votre email</h1>
      <p>Bonjour ${name}, entrez ce code dans l'application pour valider votre adresse :</p>
      <div style="text-align:center; margin:24px 0;">
        <div style="display:inline-block; background:#f0fdf4; border:2px solid #0B6E4F; border-radius:8px; padding:16px 32px; font-size:32px; font-weight:700; letter-spacing:8px; color:#0B1F16;">${code}</div>
      </div>
      <p style="font-size:12px;color:#6b7280;">Ce code expire dans 15 minutes. Si vous n'avez pas demandé cela, ignorez cet email.</p>
    `)
  )
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<SendResult> {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`
  return send(
    to,
    'Réinitialisation de votre mot de passe — fluxdechets.com',
    base(`
      <h1>Réinitialisation du mot de passe</h1>
      <p>Bonjour ${name}, vous avez demandé à réinitialiser votre mot de passe fluxdechets.com.</p>
      <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
      <p style="font-size:12px;color:#6b7280;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `)
  )
}

export async function sendPaymentReminderEmail(
  to: string,
  name: string,
  mois: string,
  montant: number
): Promise<SendResult> {
  return send(
    to,
    `Rappel paiement collecte — ${mois}`,
    base(`
      <h1>Rappel de paiement</h1>
      <p>Bonjour ${name},</p>
      <p>Votre cotisation de collecte des déchets pour <strong>${mois}</strong> est en attente de règlement.</p>
      <div class="info-box">
        Montant dû : <strong>${montant.toLocaleString('fr-TG')} FCFA</strong>
      </div>
      <p>Vous pouvez payer facilement par Tmoney ou Flooz auprès de votre agent de collecte.</p>
    `)
  )
}
