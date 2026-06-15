'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { Truck } from 'lucide-react'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<unknown>(null)

  useEffect(() => {
    fetch('/api/docs/openapi.json')
      .then(r => r.json())
      .then(setSpec)
      .catch(() => {})
  }, [])

  if (!spec) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Chargement de la documentation API…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
          <div className="w-8 h-8 rounded-md bg-[#0B1F16] flex items-center justify-center">
            <Truck size={14} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">WasteFlow API</h1>
            <p className="text-xs text-gray-500">Documentation des endpoints REST</p>
          </div>
        </div>
        <SwaggerUI spec={spec as Record<string, unknown>} />
      </div>
    </div>
  )
}
