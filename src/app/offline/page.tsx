import Link from 'next/link'
import { Truck } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F2F4F0] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#0B1F16] flex items-center justify-center mx-auto">
          <Truck size={22} className="text-brand-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Hors ligne</h1>
        <p className="text-sm text-gray-500">
          Vous êtes actuellement hors ligne. Les données affichées peuvent ne pas être à jour.
          Reconnectez-vous pour accéder aux fonctionnalités complètes.
        </p>
        <Link
          href="/login"
          className="inline-block w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm py-2.5 rounded-md"
        >
          Réessayer
        </Link>
      </div>
    </div>
  )
}
