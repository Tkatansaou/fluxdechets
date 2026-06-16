// Route supprimée — sécurité : credentials en dur
// L'utilisateur peut se connecter via POST /api/auth/login

import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'GONE', message: 'Cette route a été supprimée. Utilisez POST /api/auth/login à la place.' }, { status: 410 })
}
