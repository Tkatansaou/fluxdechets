'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { AppProvider } from '@/context/AppContext'
import { Toaster } from 'react-hot-toast'

// AuthProvider — JWT cookies + /api/auth/* (production)
// AppProvider  — localStorage mock data (demo mode, used by UI pages during migration)
// Pages will progressively migrate from useApp() to api() calls
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '14px', borderRadius: '8px', background: '#1F2937', color: '#F9FAFB' },
            success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </AppProvider>
    </AuthProvider>
  )
}
