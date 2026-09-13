'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getToken, getUser } from '@/lib/auth'
import { useStore } from '@/store/useStore'
import { UserRole } from '@/types'

interface Props {
  children?: React.ReactNode   // ← was required, now optional
  allowedRoles?: UserRole[]
}

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/authority-register']

export const ROLE_HOME: Record<UserRole, string> = {
  TOURIST:    '/dashboard/tourist',
  ADMIN:      '/dashboard/admin',
  AUTHORITY:  '/dashboard/authority',
  TOUR_GUIDE: '/dashboard/guide',
}

export default function AuthGuard({ children, allowedRoles }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const { setAuth } = useStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) { setReady(true); return }

    const token = getToken()
    const user  = getUser()

    if (!token || !user) { router.replace('/auth/login'); return }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(ROLE_HOME[user.role] || '/auth/login')
      return
    }

    setAuth(user, token)
    setReady(true)
  }, [pathname, router, setAuth, allowedRoles])

  if (!ready) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#070b14' }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl animate-ping opacity-30"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }} />
          <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}>🛡️</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Authenticating…</p>
        </div>
      </div>
    </div>
  )

  return <>{children}</>
}