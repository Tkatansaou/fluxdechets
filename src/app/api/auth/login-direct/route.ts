import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/server/prisma'
import { setAuthCookiesOnResponse } from '@/lib/server/auth'

/**
 * POST /api/auth/login-direct
 * Version ultra-simple : prend email + password en form-data, pas de JS nécessaire.
 * Alternative quand le JS client a des problèmes.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Lire le body en form-data (HTML form) ou JSON
    let email = '', password = ''
    const ct = req.headers.get('content-type') ?? ''
    
    if (ct.includes('application/json')) {
      const body = await req.json()
      email = body.email ?? ''
      password = body.password ?? ''
    } else {
      const form = await req.formData()
      email = (form.get('email') as string) ?? ''
      password = (form.get('password') as string) ?? ''
    }

    if (!email || !password) {
      return html(400, 'Email et mot de passe requis')
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, status: true, tokenVersion: true, name: true, role: true },
    })

    if (!user || !user.passwordHash) {
      return html(401, 'Email ou mot de passe incorrect')
    }

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      return html(401, 'Email ou mot de passe incorrect')
    }

    if (user.status === 'SUSPENDED') {
      return html(403, 'Compte suspendu')
    }

    // Trouver l'organisation
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })

    if (!membership) {
      return html(500, 'Aucune organisation trouvée')
    }

    const effectiveRole = user.role === 'SUPERADMIN' ? 'SUPERADMIN' :
      membership.role === 'OWNER' ? 'ADMIN' : membership.role

    // Rediriger vers le dashboard avec les cookies
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', req.url))
    await setAuthCookiesOnResponse(redirectResponse, user.id, user.email, membership.organizationId, effectiveRole, user.tokenVersion)

    return redirectResponse
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return html(500, msg)
  }
}

/** Page de login HTML minimaliste (zéro JavaScript) */
export async function GET(): Promise<NextResponse> {
  const page = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connexion — WasteFlow</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f2f4f0;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 20px;
    }
    .card {
      background: white; border-radius: 12px; padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; max-width: 380px;
    }
    h1 { font-size: 20px; color: #111827; margin-bottom: 4px; }
    p { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
    label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; }
    input {
      width: 100%; padding: 8px 12px; border: 1px solid #d1d5db;
      border-radius: 6px; font-size: 14px; margin-bottom: 16px;
    }
    input:focus { outline: none; border-color: #15803d; box-shadow: 0 0 0 2px rgba(21,128,61,0.2); }
    button {
      width: 100%; padding: 10px; background: #15803d; color: white;
      border: none; border-radius: 6px; font-size: 14px; font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #166534; }
    .error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; padding: 10px; font-size: 13px; margin-bottom: 16px; }
    .success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px; font-size: 13px; margin-bottom: 16px; text-align: center; }
    .logo { text-align: center; margin-bottom: 20px; }
    .logo img { width: 40px; height: 40px; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2"><path d="M5 17h14M5 17l-2-4h14l2 4M5 17l-4 4m18-4l4 4"/><path d="M9 8h6"/><path d="M10 5h4"/></svg>
    </div>
    <h1>WasteFlow</h1>
    <p>Connectez-vous pour piloter votre DSP</p>

    <form method="POST" action="/api/auth/login-direct">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" value="katantchaa@gmail.com" required>

      <label for="password">Mot de passe</label>
      <input type="password" id="password" name="password" value="Admin123!" required>

      <button type="submit">Se connecter</button>
    </form>

    <div class="footer">
      WasteFlow &copy; 2026 — DSP Déchets Solides
    </div>
  </div>
</body>
</html>`

  return new NextResponse(page, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function html(status: number, message: string): NextResponse {
  const emoji = status === 200 ? '✅' : '❌'
  const color = status === 200 ? '#15803d' : '#dc2626'
  const page = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Connexion — WasteFlow</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #f2f4f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
  .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  h2 { color: ${color}; font-size: 18px; margin-bottom: 8px; }
  p { color: #6b7280; font-size: 14px; }
  a { display: inline-block; margin-top: 20px; color: #15803d; text-decoration: none; font-size: 14px; }
  a:hover { text-decoration: underline; }
</style></head>
<body>
  <div class="card">
    <div class="icon">${emoji}</div>
    <h2>${message}</h2>
    ${status >= 400 ? '<p>Vérifiez vos identifiants et réessayez.</p><a href="/api/auth/login-direct">← Retour à la connexion</a>' : '<p>Redirection vers le tableau de bord...</p><meta http-equiv="refresh" content="1;url=/dashboard">'}
  </div>
</body>
</html>`
  return new NextResponse(page, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
