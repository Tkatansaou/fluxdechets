import type { Metadata } from 'next'
import LoginWrapper from './LoginWrapper'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre espace WasteFlow pour piloter votre contrat DSP de collecte des déchets.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginWrapper />
}
