'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

// Import dynamique — Leaflet ne fonctionne pas en SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then(m => m.MapContainer),
  { ssr: false },
)
const TileLayer = dynamic(
  () => import('react-leaflet').then(m => m.TileLayer),
  { ssr: false },
)
const Marker = dynamic(
  () => import('react-leaflet').then(m => m.Marker),
  { ssr: false },
)
const Popup = dynamic(
  () => import('react-leaflet').then(m => m.Popup),
  { ssr: false },
)

interface ZoneMapPoint {
  id: string
  nom: string
  lat: number
  lng: number
  abonnesCount: number
  description?: string
}

interface ZoneMapProps {
  zones: ZoneMapPoint[]
  center?: [number, number]
  zoom?: number
  className?: string
}

export function ZoneMap({ zones, center = [6.1725, 1.2318], zoom = 12, className = '' }: ZoneMapProps) {
  const [mounted, setMounted] = useState(false)
  const [LeafletIcon, setLeafletIcon] = useState<typeof import('leaflet').Icon | null>(null)

  useEffect(() => {
    setMounted(true)
    // Fix Leaflet default icon issue with bundlers
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9/dist/images/marker-shadow.png',
      })
      setLeafletIcon(L.Icon)
    })
  }, [])

  if (!mounted) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-gray-400">
          <MapPin size={32} className="mx-auto mb-2" />
          <p className="text-sm">Chargement de la carte…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-64 w-full z-0"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map(zone => (
          <Marker key={zone.id} position={[zone.lat, zone.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>{zone.nom}</strong>
                <br />
                {zone.description && <span className="text-gray-500">{zone.description}<br /></span>}
                <span className="font-medium text-brand-700">{zone.abonnesCount} abonnés</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
