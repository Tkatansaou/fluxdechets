import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre espace WasteFlow pour piloter votre contrat DSP de collecte des déchets.',
  robots: { index: false, follow: false },
}

const LoginClient = dynamic(() => import('./LoginClient'), { ssr: false })

export default function LoginPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F2F4F0]">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <LoginClient />
    </div>
  )
}
