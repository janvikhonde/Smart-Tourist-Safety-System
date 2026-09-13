'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { getUser, clearAuth as clearStorage } from '@/lib/auth'

interface Props {
  title: string
  subtitle?: string
}

export default function TopBar({ title, subtitle }: Props) {
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen, clearAuth, activeAlerts } = useStore()
  const user = getUser()

  const [now, setNow] = useState(new Date())
  const [showDropdown, setDrop] = useState(false)

  const dropRef = useRef<HTMLDivElement>(null)

  /* ✅ FIX: ensure activeAlerts is always an array */
  const alertsArray = Array.isArray(activeAlerts) ? activeAlerts : []

  const highAlerts = alertsArray.filter(
    (a: any) => a.status === 'ACTIVE' && a.priority === 'HIGH'
  ).length

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDrop(false)
      }
    }

    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const logout = () => {
    clearStorage()
    clearAuth()
    router.replace('/auth/login')
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-5 h-16 shrink-0"
      style={{
        background: 'rgba(7,11,20,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(56,189,248,0.07)',
      }}
    >

      {/* Left Section */}
      <div className="flex items-center gap-4 min-w-0">

        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
            text-slate-500 hover:text-slate-200 hover:bg-white/[0.06]
            transition-all duration-150"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                sidebarOpen
                  ? 'M6 18L18 6M6 6l12 12'
                  : 'M4 6h16M4 12h16M4 18h16'
              }
            />
          </svg>
        </button>

        {/* Title */}
        <div className="min-w-0">
          <h1 className="font-bold text-white text-base truncate">
            {title}
          </h1>

          {subtitle && (
            <p className="text-slate-500 text-xs truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Clock */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(56,189,248,0.05)' }}
        >
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="font-mono text-xs text-slate-400">
            {timeStr}
          </span>

          <span
            className="text-[10px] text-slate-600 border-l pl-2"
            style={{ borderColor: 'rgba(56,189,248,0.1)' }}
          >
            {dateStr}
          </span>
        </div>

        {/* Alert Bell */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center
          text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118
              14.158V11a6.002 6.002 0 00-4-5.659V5a2
              2 0 10-4 0v.341C7.67 6.165 6
              8.388 6 11v3.159c0 .538-.214
              1.055-.595 1.436L4 17h5m6
              0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          {highAlerts > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full
              text-[9px] font-bold text-white flex items-center
              justify-center animate-pulse"
              style={{ background: '#f43f5e' }}
            >
              {highAlerts > 9 ? '9+' : highAlerts}
            </span>
          )}
        </button>

        {/* User Avatar */}
        {user && (
          <div className="relative" ref={dropRef}>

            <button
              onClick={() => setDrop(v => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl
              hover:bg-white/[0.06] transition-all"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center
                text-xs font-bold text-sky-400"
                style={{
                  background: 'rgba(56,189,248,0.15)',
                  border: '1px solid rgba(56,189,248,0.2)',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200">
                  {user.name.split(' ')[0]}
                </p>

                <p className="text-[10px] text-slate-600">
                  {user.role}
                </p>
              </div>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-xl py-1.5 z-50"
                style={{
                  background: '#111d35',
                  border: '1px solid rgba(56,189,248,0.12)',
                }}
              >

                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-white">
                    {user.name}
                  </p>

                  <p className="text-xs text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>

                <button
                  onClick={() => router.push('/profile')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-white/[0.04]"
                >
                  👤 My Profile
                </button>

                <button
                  onClick={() => router.push('/settings')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-white/[0.04]"
                >
                  ⚙️ Settings
                </button>

                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/[0.06]"
                >
                  🚪 Sign Out
                </button>

              </div>
            )}
          </div>
        )}

      </div>
    </header>
  )
}