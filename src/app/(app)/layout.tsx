'use client'

import { useUser } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useUser('/login')
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F2F4F0]">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F2F4F0] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-14 md:pb-0">
          <div className="p-4 md:p-5">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
