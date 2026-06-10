'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { COOKIE_PREFIX } from '@/lib/constants'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const csrfCookieName = `${COOKIE_PREFIX}-csrf`
    const hasSession = document.cookie
      .split(';')
      .some(c => c.trim().startsWith(`${csrfCookieName}=`))
    router.replace(hasSession ? '/dashboard' : '/login')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-[#F2F4F0]">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
