import type { Metadata } from 'next'
import SignupClient from './SignupClient'

export const metadata: Metadata = {
  title: 'Créer un espace',
  description: 'Créez votre espace WasteFlow pour piloter votre contrat DSP de collecte des déchets ménagers au Togo.',
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  return <SignupClient />
}
