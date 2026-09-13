'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { ROLE_HOME } from '@/components/layout/AuthGuard'
import { UserRole } from '@/types'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.replace('/auth/login')
      return
    }
    router.replace(ROLE_HOME[user.role as UserRole] ?? '/dashboard/tourist')
  }, [router])

  return (
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
          <p className="text-slate-400 text-sm font-medium">Redirecting…</p>
        </div>
      </div>
    </div>
  )
}