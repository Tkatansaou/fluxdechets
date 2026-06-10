import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'WasteFlow — Pilotage DSP Déchets Solides'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0B1F16',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Decorative top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: '#16A34A', display: 'flex' }} />

        {/* Logo area */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: '#16A34A',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 20,
              fontSize: 36,
            }}
          >
            ♻
          </div>
          <span style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>
            WasteFlow
          </span>
        </div>

        {/* Tagline */}
        <div style={{ color: '#FFFFFF', fontSize: 36, fontWeight: 600, marginBottom: 16, lineHeight: 1.2 }}>
          Pilotez votre contrat DSP<br />
          de collecte de déchets
        </div>
        <div style={{ color: '#86EFAC', fontSize: 22, marginBottom: 48, lineHeight: 1.5 }}>
          Abonnés · Tournées · Recouvrement Tmoney/Flooz · Rapports mairie
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { label: 'Abonnés suivis', value: '900+' },
            { label: 'Taux recouvrement', value: '80%' },
            { label: 'Mobile money', value: 'XOF' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '16px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700 }}>{stat.value}</span>
              <span style={{ color: '#86EFAC', fontSize: 14, marginTop: 4 }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 40, right: 72, color: '#4ADE80', fontSize: 18 }}>
          fluxdechets.com
        </div>
      </div>
    ),
    { ...size }
  )
}
