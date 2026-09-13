'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { setAuth } from '@/lib/auth'
import { AuthResponse } from '@/types'

const AUTHORITY_ROLES = [
  { key: 'ADMIN',      label: 'Admin',      desc: 'Full system access' },
  { key: 'TOUR_GUIDE', label: 'Tour Guide', desc: 'Manage tourist spots & routes' },
] as const

type AuthorityRole = typeof AUTHORITY_ROLES[number]['key']

const ROLE_REDIRECT: Record<string, string> = {
  TOURIST:    '/dashboard/tourist',
  ADMIN:      '/dashboard/admin',
  AUTHORITY:  '/dashboard/authority',
  TOUR_GUIDE: '/dashboard/guide',
}

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab]                     = useState<'tourist' | 'authority'>('tourist')
  const [authorityRole, setAuthorityRole] = useState<AuthorityRole>('ADMIN')
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [email, setEmail]                 = useState('')
  const [pass,  setPass]                  = useState('')
  const [otp,   setOtp]                   = useState('')
  const [otpSent,  setOtpSent]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await authApi.login(email, pass)
      setOtpSent(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError('Please enter the OTP'); return }
    setLoading(true); setError('')
    try {
      const res  = await authApi.verifyLogin(email, otp)
      const data: AuthResponse = res.data?.data ?? res.data
      const userId = data.userId ?? (data as unknown as { id?: number }).id ?? 0
      const user = {
        id:        userId,
        name:      data.name,
        email,
        role:      data.role as 'TOURIST' | 'AUTHORITY' | 'ADMIN' | 'TOUR_GUIDE',
        touristId: data.touristId ?? data.profileId ?? null,
      }
      setAuth(data.token, user)
      const redirect = ROLE_REDIRECT[data.role] ?? '/dashboard/tourist'
      router.replace(redirect)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally { setLoading(false) }
  }

  const selected = AUTHORITY_ROLES.find(r => r.key === authorityRole)!

  return (
    <div style={S.root}>
      <div style={S.bg} />

      <div style={S.wrapper}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.logoWrap}>
            <div style={S.logo}>🛡️</div>
          </div>
          <h1 style={S.brand}>SafeTrail</h1>
          <p style={S.brandSub}>Smart Tourist Safety System</p>
        </div>

        {/* Card */}
        <div style={S.card}>

          {/* Tab switcher */}
          {!otpSent && (
            <div style={S.tabs}>
              {(['tourist', 'authority'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); setDropdownOpen(false) }}
                  style={{
                    ...S.tabBtn,
                    ...(tab === t ? S.tabActive : S.tabInactive),
                  }}
                >
                  {t === 'tourist' ? '👤 Tourist' : '👮 Authority'}
                </button>
              ))}
            </div>
          )}

          {/* Authority role dropdown */}
          {!otpSent && tab === 'authority' && (
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label style={S.label}>Authority type</label>
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  ...S.input,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: dropdownOpen ? '0.5px solid #3B82F6' : '0.5px solid #E2E8F0',
                }}
              >
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>
                  {selected.label}
                  <span style={{ color: '#94A3B8', fontWeight: 400, marginLeft: 8 }}>{selected.desc}</span>
                </span>
                <svg
                  style={{ width: 14, height: 14, color: '#94A3B8', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div style={S.dropdown}>
                  {AUTHORITY_ROLES.map((role, i) => {
                    const isActive = authorityRole === role.key
                    return (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => { setAuthorityRole(role.key); setDropdownOpen(false) }}
                        style={{
                          ...S.dropItem,
                          background: isActive ? '#EFF6FF' : 'transparent',
                          borderBottom: i < AUTHORITY_ROLES.length - 1 ? '0.5px solid #F1F5F9' : 'none',
                        }}
                      >
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: isActive ? '#1D4ED8' : '#0F172A', margin: 0 }}>{role.label}</p>
                          <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{role.desc}</p>
                        </div>
                        {isActive && (
                          <svg style={{ width: 14, height: 14, color: '#2563EB', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Login form */}
          {!otpSent && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Email Address</label>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={S.input}
                />
              </div>
              <div>
                <label style={S.label}>Password</label>
                <input
                  type="password" value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={S.input}
                />
              </div>
              {error && <div style={S.errorBox}>{error}</div>}
              <button type="submit" disabled={loading} style={S.btnPrimary}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={S.spinner} />Sending OTP…
                    </span>
                  : tab === 'tourist' ? '👤 Sign In as Tourist' : `👮 Sign In as ${selected.label}`
                }
              </button>
            </form>
          )}

          {/* OTP screen */}
          {otpSent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={S.infoBox}>
                <span style={{ fontSize: 16 }}>{tab === 'tourist' ? '👤' : '👮'}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                    {tab === 'tourist' ? 'Tourist Login' : selected.label}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
                    OTP sent to <span style={{ color: '#2563EB', fontWeight: 600 }}>{email}</span>
                  </p>
                </div>
              </div>
              <div style={{ ...S.infoBox, background: '#F0FDF4', border: '0.5px solid #BBF7D0' }}>
                <span style={{ fontSize: 16 }}>✉️</span>
                <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>
                  Check your inbox and enter the 6-digit OTP below.
                </p>
              </div>
              <div>
                <label style={S.label}>Enter OTP</label>
                <input
                  type="text" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  maxLength={6}
                  style={{ ...S.input, letterSpacing: 4, fontSize: 16, fontWeight: 600 }}
                />
              </div>
              {error && <div style={S.errorBox}>{error}</div>}
              <button onClick={handleVerifyOtp} disabled={loading} style={S.btnPrimary}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={S.spinner} />Verifying…
                    </span>
                  : '✅ Verify OTP & Sign In'
                }
              </button>
              <button
                onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
                style={S.btnGhost}
              >
                ← Use a different email
              </button>
            </div>
          )}

          {/* Footer links */}
          {!otpSent && (
            <div style={S.cardFooter}>
              {tab === 'tourist' ? (
                <p style={S.footerTxt}>
                  New tourist?{' '}
                  <Link href="/auth/register" style={S.footerLink}>Register here</Link>
                </p>
              ) : (
                <p style={S.footerTxt}>
                  New authority?{' '}
                  <Link href="/auth/authority-register" style={S.footerLink}>Register as Authority</Link>
                </p>
              )}
            </div>
          )}
        </div>

        <p style={S.version}>SafeTrail v1.0 · Aurangabad Tourism Safety Project</p>
      </div>
    </div>
  )
}

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: '#F8FAFC',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(59,130,246,0.06), transparent)',
    pointerEvents: 'none',
  },
  wrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    boxShadow: '0 4px 14px rgba(59,130,246,0.25)',
  },
  brand: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
    margin: '0 0 4px',
  },
  brandSub: {
    fontSize: 12,
    color: '#94A3B8',
    margin: 0,
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '0.5px solid #E2E8F0',
    padding: '24px 28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    padding: 4,
    background: '#F1F5F9',
    borderRadius: 10,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 7,
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: '#FFFFFF',
    color: '#1D4ED8',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  tabInactive: {
    background: 'transparent',
    color: '#94A3B8',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748B',
    display: 'block',
    marginBottom: 6,
    letterSpacing: '0.2px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '0.5px solid #E2E8F0',
    fontSize: 13,
    color: '#0F172A',
    background: '#FAFAFA',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 'calc(100% + 4px)',
    background: '#FFFFFF',
    border: '0.5px solid #E2E8F0',
    borderRadius: 10,
    zIndex: 50,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  dropItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  errorBox: {
    fontSize: 12,
    color: '#BE123C',
    background: '#FFF1F2',
    border: '0.5px solid #FECDD3',
    borderRadius: 8,
    padding: '9px 12px',
  },
  btnPrimary: {
    width: '100%',
    padding: '11px 0',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #2563EB, #0891B2)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    marginTop: 4,
  },
  btnGhost: {
    width: '100%',
    padding: '9px 0',
    background: 'transparent',
    border: 'none',
    fontSize: 12,
    color: '#94A3B8',
    cursor: 'pointer',
    transition: 'color 0.15s',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    background: '#EFF6FF',
    border: '0.5px solid #BFDBFE',
    borderRadius: 8,
  },
  cardFooter: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: '0.5px solid #F1F5F9',
    textAlign: 'center',
  },
  footerTxt: {
    fontSize: 12,
    color: '#94A3B8',
    margin: 0,
  },
  footerLink: {
    color: '#2563EB',
    fontWeight: 600,
    textDecoration: 'none',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 20,
    margin: '20px 0 0',
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
}