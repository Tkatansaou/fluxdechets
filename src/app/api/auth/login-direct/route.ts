export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/server/prisma'
import { setAuthCookiesOnResponse } from '@/lib/server/auth'

/**
 * GET /api/auth/login-direct
 * Page de connexion HTML statique — zéro JS, zéro dépendance Next.js.
 * Fonctionne même derrière un proxy restrictif.
 */
export async function GET(): Promise<NextResponse> {
  return new NextResponse(PAGE, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  })
}

/**
 * POST /api/auth/login-direct
 * Reçoit le formulaire, authentifie, redirige.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let email = '', password = ''
  const ct = req.headers.get('content-type') ?? ''

  try {
    if (ct.includes('application/json')) {
      const body = await req.json()
      email = body.email ?? ''
      password = body.password ?? ''
    } else {
      const form = await req.formData()
      email = (form.get('email') as string) ?? ''
      password = (form.get('password') as string) ?? ''
    }
  } catch {
    return respond(400, 'Erreur de lecture du formulaire')
  }

  if (!email || !password) {
    return respond(400, 'Email et mot de passe requis')
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, status: true, tokenVersion: true, name: true, role: true },
    })

    if (!user || !user.passwordHash) return respond(401, 'Email ou mot de passe incorrect')
    if (!(await bcrypt.compare(password, user.passwordHash))) return respond(401, 'Email ou mot de passe incorrect')
    if (user.status === 'SUSPENDED') return respond(403, 'Compte suspendu')

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })

    if (!membership) return respond(500, 'Aucune organisation associée à ce compte')

    const role = user.role === 'SUPERADMIN' ? 'SUPERADMIN' : membership.role === 'OWNER' ? 'ADMIN' : membership.role
    const res = NextResponse.redirect(new URL('/dashboard', req.url))
    await setAuthCookiesOnResponse(res, user.id, user.email, membership.organizationId, role, user.tokenVersion)
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur'
    return respond(500, msg)
  }
}

function respond(status: number, message: string): NextResponse {
  return new NextResponse(RESULT(status, message), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache, no-store' },
  })
}

function RESULT(s: number, m: string): string {
  const ok = s < 400
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>WasteFlow</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f2f4f0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;text-align:center;max-width:400px;width:100%}
.icon{font-size:48px;margin-bottom:16px}
h2{color:${ok?'#15803d':'#dc2626'};font-size:18px;margin-bottom:8px}
p{color:#6b7280;font-size:14px;margin-bottom:16px}
a{color:#15803d;font-size:14px}
.m{background:${ok?'#f0fdf4':'#fef2f2'};border:1px solid ${ok?'#bbf7d0':'#fecaca'};border-radius:6px;padding:12px;font-size:13px;margin-bottom:16px;text-align:center;color:${ok?'#15803d':'#dc2626'}}</style></head><body>
<div class="card"><div class="icon">${ok?'✅':'❌'}</div>
<h2>${ok?'Connexion réussie !':'Échec de la connexion'}</h2>
<div class="m">${m}</div>
${ok?'<p>Redirection vers le tableau de bord...</p><meta http-equiv="refresh" content="1;url=/dashboard">':`<a href="/api/auth/login-direct">← Réessayer</a>`}
<p style="margin-top:24px;font-size:11px;color:#9ca3af">WasteFlow &copy; 2026</p>
</div></body></html>`
}

const PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Connexion — WasteFlow</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#f2f4f0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{background:#fff;border-radius:12px;padding:32px;width:100%;max-width:380px}
.logo{text-align:center;margin-bottom:16px}
h1{font-size:22px;text-align:center;color:#111827;margin-bottom:4px}
.sub{font-size:13px;text-align:center;color:#6b7280;margin-bottom:24px}
label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px}
input{width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;margin-bottom:16px;transition:border-color .15s}
input:focus{outline:none;border-color:#15803d;box-shadow:0 0 0 3px rgba(21,128,61,.15)}
button{width:100%;padding:11px;background:#15803d;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s}
button:hover{background:#166534}
button:active{transform:scale(.98)}
.footer{text-align:center;font-size:11px;color:#9ca3af;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6}
.info{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 12px;font-size:12px;color:#15803d;margin-bottom:16px;text-align:center}
</style>
</head>
<body>
<div class="card">
<div class="logo"><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#15803d"/><path d="M12 28h16M12 28l-2-6h20l-2 6M12 28l-4 4M28 28l4 4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M16 18h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg></div>
<h1>WasteFlow</h1>
<p class="sub">Pilotage DSP — Déchets Solides</p>

<div class="info">Formulaire simplifi&eacute; — sans JavaScript</div>

<form method="POST" action="/api/auth/login-direct">
<label for="e">Email</label>
<input type="email" id="e" name="email" value="katantchaa@gmail.com" required autocomplete="email">

<label for="p">Mot de passe</label>
<input type="password" id="p" name="password" value="Admin123!" required autocomplete="current-password">

<button type="submit">Se connecter</button>
</form>

<div class="footer">WasteFlow &copy; 2026 — DSP D&eacute;chets Solides</div>
</div>
</body>
</html>`
