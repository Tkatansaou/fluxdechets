'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExportCsvBtnProps {
  type: 'abonnes' | 'paiements' | 'tournees' | 'engins' | 'employes'
  label?: string
  className?: string
}

export function ExportCsvBtn({ type, label, className = '' }: ExportCsvBtnProps) {
  const [loading, setLoading] = useState(false)

  const labels: Record<string, string> = {
    abonnes: 'Exporter abonnés',
    paiements: 'Exporter paiements',
    tournees: 'Exporter tournées',
    engins: 'Exporter engins',
    employes: 'Exporter employés',
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/export?type=${type}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur export' }))
        throw new Error(err.error ?? 'Erreur export')
      }

      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="?(.+?)"?$/)
      const filename = match?.[1] ?? `${type}-export.csv`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Export CSV téléchargé')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'export')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 ${className}`}
    >
      <Download size={13} className={loading ? 'animate-bounce' : ''} />
      {loading ? 'Téléchargement…' : (label ?? labels[type])}
    </button>
  )
}
