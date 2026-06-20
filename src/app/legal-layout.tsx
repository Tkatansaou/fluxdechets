'use client'

import Link from 'next/link'
import { Truck, ChevronLeft } from 'lucide-react'

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
              <Truck size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">WasteFlow</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft size={14} />
            Retour
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 20 juin 2026</p>
        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-emerald-700 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-800 prose-ul:mt-2 prose-li:text-gray-600">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} WasteFlow — Propulsé depuis Lomé, Togo
        </div>
      </footer>
    </div>
  )
}
