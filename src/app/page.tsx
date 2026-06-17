import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

const COOKIE_PREFIX = process.env.NEXT_PUBLIC_COOKIE_PREFIX ?? 'wf'

export default async function Home() {
  const cookieStore = await cookies()
  const hasSession = cookieStore.has(`${COOKIE_PREFIX}-csrf`)
  redirect(hasSession ? '/dashboard' : '/login')
}
