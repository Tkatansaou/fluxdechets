// Moneroo payment gateway client — https://moneroo.io
// Supports: T-Money, Flooz, Moov Money (Togo)

const BASE = 'https://api.moneroo.io/v1'

export type MonerooMethod = 'tg_tmoney' | 'tg_flooz' | 'tg_moov_money'

export interface MonerooPayment {
  id: string
  status: string
  checkoutUrl?: string
}

interface MonerooInitResponse {
  data: { id: string; status: string; checkout_url?: string }
}

export function isMonerooConfigured(): boolean {
  return !!process.env.MONEROO_SECRET_KEY
}

export function operateurToMoneroo(operateur: string): MonerooMethod {
  const map: Record<string, MonerooMethod> = {
    tmoney:  'tg_tmoney',
    flooz:   'tg_flooz',
    moov:    'tg_moov_money',
  }
  return map[operateur] ?? 'tg_tmoney'
}

export async function initMonerooPayment(params: {
  amount: number
  phone: string
  firstName: string
  lastName: string
  email?: string
  operateur: string
  description: string
  returnUrl: string
  notificationUrl: string
  metadata?: Record<string, unknown>
}): Promise<MonerooPayment> {
  const key = process.env.MONEROO_SECRET_KEY
  if (!key) throw new Error('MONEROO_SECRET_KEY not configured')

  const res = await fetch(`${BASE}/payments/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: 'XOF',
      description: params.description,
      payment_method: operateurToMoneroo(params.operateur),
      customer: {
        email: params.email ?? 'client@fluxdechets.com',
        first_name: params.firstName,
        last_name: params.lastName,
        phone: params.phone,
      },
      return_url: params.returnUrl,
      notification_url: params.notificationUrl,
      metadata: params.metadata ?? {},
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Moneroo ${res.status}: ${text}`)
  }

  const json = await res.json() as MonerooInitResponse
  return {
    id: json.data.id,
    status: json.data.status,
    checkoutUrl: json.data.checkout_url,
  }
}
