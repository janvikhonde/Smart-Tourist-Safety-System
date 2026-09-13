'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { setAuth } from '@/lib/auth'
import { AuthResponse } from '@/types'

// ── Authority role options ────────────────────────────────────────────────────
const AUTHORITY_ROLES = [
  { key: 'ADMIN',      label: 'Admin',                 emoji: '🛡️', desc: 'Full system access' },
  { key: 'POLICE',     label: 'Police',                emoji: '🚔', desc: 'Safety & emergency response' },
  { key: 'TOUR_GUIDE', label: 'Tour Guide',            emoji: '🧭', desc: 'Manage tourist spots & routes' },
  { key: 'HOTEL',      label: 'Hotel / Stay Provider', emoji: '🏨', desc: 'Manage accommodation listings' },
] as const

type AuthorityRole = typeof AUTHORITY_ROLES[number]['key']

const STEPS = ['Role & Info', 'Work Details', 'Confirm']

interface FormData {
  name: string
  email: string
  password: string
  phone: string
  role: AuthorityRole
  // Work details
  department: string
  badgeNumber: string
  designation: string
  officeAddress: string
}

export default function AuthorityRegisterPage() {
  const router = useRouter()
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp]         = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [savedPayload, setSavedPayload] = useState<object | null>(null)

  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', phone: '',
    role: 'ADMIN',
    department: '', badgeNumber: '', designation: '', officeAddress: '',
  })

  const set = (key: keyof FormData, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const selectedRole = AUTHORITY_ROLES.find(r => r.key === form.role)!

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep = (): boolean => {
    setError('')
    if (step === 0) {
      if (!form.name.trim())        { setError('Full name is required'); return false }
      if (!form.email.trim())       { setError('Email is required'); return false }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return false }
      if (!form.phone.trim())       { setError('Phone number is required'); return false }
    }
    if (step === 1) {
      if (!form.department.trim())  { setError('Department / Organization is required'); return false }
      if (!form.designation.trim()) { setError('Designation is required'); return false }
    }
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => { setError(''); setStep(s => s - 1) }

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        name:        form.name,
        email:       form.email,
        password:    form.password,
        phone:       form.phone,
        role:        form.role,           // ADMIN | POLICE | TOUR_GUIDE | HOTEL
        department:  form.department,
        badgeNumber: form.badgeNumber,
        designation: form.designation,
        officeAddress: form.officeAddress,
      }
      await authApi.register(payload)
      setSavedPayload(payload)
      setOtpSent(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError('Please enter the OTP'); return }
    setLoading(true)
    setError('')
    try {
      const res  = await authApi.verifyRegister(form.email, otp, savedPayload!)
      const data: AuthResponse = res.data?.data ?? res.data
      const userId = data.userId ?? (data as unknown as { id?: number }).id
      if (!userId) {
        setError('Registration succeeded but no user ID returned. Please log in.')
        return
      }
      const user = {
        id:        userId,
        name:      form.name,
        email:     form.email,
        role:      (data.role ?? form.role) as 'TOURIST' | 'AUTHORITY' | 'ADMIN',
        touristId: data.touristId ?? data.profileId ?? null,
      }
      setAuth(data.token, user)
      router.replace('/authority')   // authority goes straight to dashboard
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls   = `w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600
    outline-none focus:ring-2 focus:ring-sky-400/40 transition-all`
  const inputStyle = { background: '#0d1525', border: '1px solid rgba(56,189,248,0.15)' }
  const labelCls   = 'text-xs text-slate-400 font-medium block mb-1.5'

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#070b14' }}
    >
      {/* Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[500px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #6366f1, transparent)' }}
      />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#6366f1,#38bdf8)' }}
          >
            👮
          </div>
          <h1 className="font-syne font-bold text-white text-2xl">
            {otpSent ? 'Verify Your Email' : 'Authority Registration'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {otpSent
              ? `OTP sent to ${form.email}`
              : 'Register as an authorized SafeTrail official'}
          </p>
        </div>

        {/* Step progress */}
        {!otpSent && (
          <div className="flex items-center justify-between mb-6 px-1">
            {STEPS.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-center w-full">
                  <div
                    className={`w-full h-0.5 ${i === 0 ? 'invisible' : ''}`}
                    style={{ background: i <= step ? '#6366f1' : 'rgba(99,102,241,0.15)' }}
                  />
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: i <= step ? '#6366f1' : 'rgba(99,102,241,0.2)' }}
                  />
                  <div
                    className={`w-full h-0.5 ${i === STEPS.length - 1 ? 'invisible' : ''}`}
                    style={{ background: i < step ? '#6366f1' : 'rgba(99,102,241,0.15)' }}
                  />
                </div>
                <span className="text-[10px] font-medium"
                  style={{ color: i <= step ? '#818cf8' : '#475569' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{ background: '#111d35', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          {/* ── OTP Screen ── */}
          {otpSent ? (
            <div className="space-y-4">
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <span className="text-xl">{selectedRole.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{selectedRole.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    OTP sent to <span className="text-indigo-400 font-semibold">{form.email}</span>
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)' }}
              >
                <span className="text-lg">✉️</span>
                <p className="text-xs text-slate-300">
                  We sent a 6-digit OTP to{' '}
                  <span className="text-sky-400 font-semibold">{form.email}</span>.
                  Check your inbox and enter the code below.
                </p>
              </div>

              <div>
                <label className={labelCls}>Enter OTP</label>
                <input
                  type="text" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit OTP" maxLength={6}
                  className={inputCls} style={inputStyle}
                />
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20
                  rounded-lg px-3 py-2">{error}</div>
              )}

              <button
                onClick={handleVerifyOtp} disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#6366f1,#38bdf8)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </span>
                ) : '✅ Verify & Complete Registration'}
              </button>

              <button
                onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-all"
              >
                ← Go back and edit details
              </button>
            </div>

          ) : (
            <>
              {/* ── Step 0: Role & Personal Info ── */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-syne font-bold text-white text-lg mb-2">Role & Personal Info</h2>

                  {/* Role dropdown */}
                  <div className="relative">
                    <label className={labelCls}>Authority Type</label>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(o => !o)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                        text-sm transition-all outline-none"
                      style={{
                        background: '#0d1525',
                        border: dropdownOpen
                          ? '1px solid rgba(99,102,241,0.6)'
                          : '1px solid rgba(99,102,241,0.25)',
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-lg leading-none">{selectedRole.emoji}</span>
                        <span className="text-white font-medium">{selectedRole.label}</span>
                        <span className="text-slate-500 text-xs hidden sm:inline">{selectedRole.desc}</span>
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200
                          ${dropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {dropdownOpen && (
                      <div
                        className="absolute left-0 right-0 mt-1 rounded-xl z-50 shadow-2xl"
                        style={{
                          background: '#0d1525',
                          border: '1px solid rgba(99,102,241,0.2)',
                          maxHeight: '210px',
                          overflowY: 'auto',
                        }}
                      >
                        {AUTHORITY_ROLES.map((role, i) => {
                          const isActive = form.role === role.key
                          return (
                            <button
                              key={role.key}
                              type="button"
                              onClick={() => { set('role', role.key); setDropdownOpen(false) }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                              style={{
                                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                                borderBottom: i < AUTHORITY_ROLES.length - 1
                                  ? '1px solid rgba(255,255,255,0.04)'
                                  : 'none',
                              }}
                            >
                              <span className="text-xl leading-none">{role.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm ${isActive ? 'text-indigo-300' : 'text-white'}`}>
                                  {role.label}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{role.desc}</p>
                              </div>
                              {isActive && (
                                <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none"
                                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input className={inputCls} style={inputStyle}
                      value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Your full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <input type="email" className={inputCls} style={inputStyle}
                      value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="official@example.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Password</label>
                    <input type="password" className={inputCls} style={inputStyle}
                      value={form.password} onChange={e => set('password', e.target.value)}
                      placeholder="Min. 6 characters" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input type="tel" className={inputCls} style={inputStyle}
                      value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="9876543210" />
                  </div>
                </div>
              )}

              {/* ── Step 1: Work Details ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-syne font-bold text-white text-lg mb-2">Work Details</h2>

                  <div>
                    <label className={labelCls}>Department / Organization</label>
                    <input className={inputCls} style={inputStyle}
                      value={form.department} onChange={e => set('department', e.target.value)}
                      placeholder={
                        form.role === 'POLICE'     ? 'e.g. Aurangabad City Police' :
                        form.role === 'TOUR_GUIDE' ? 'e.g. Maharashtra Tourism Board' :
                        form.role === 'HOTEL'      ? 'e.g. Hotel Taj Aurangabad' :
                        'e.g. Tourism Safety Dept'
                      } />
                  </div>
                  <div>
                    <label className={labelCls}>Designation</label>
                    <input className={inputCls} style={inputStyle}
                      value={form.designation} onChange={e => set('designation', e.target.value)}
                      placeholder={
                        form.role === 'POLICE'     ? 'e.g. Sub-Inspector' :
                        form.role === 'TOUR_GUIDE' ? 'e.g. Senior Tour Guide' :
                        form.role === 'HOTEL'      ? 'e.g. Manager' :
                        'e.g. System Administrator'
                      } />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {form.role === 'POLICE' ? 'Badge Number' :
                       form.role === 'TOUR_GUIDE' ? 'Guide License Number' :
                       form.role === 'HOTEL' ? 'Property Registration No.' :
                       'Employee ID'} <span className="text-slate-600">(optional)</span>
                    </label>
                    <input className={inputCls} style={inputStyle}
                      value={form.badgeNumber} onChange={e => set('badgeNumber', e.target.value)}
                      placeholder="ID / Badge / License number" />
                  </div>
                  <div>
                    <label className={labelCls}>Office / Work Address <span className="text-slate-600">(optional)</span></label>
                    <input className={inputCls} style={inputStyle}
                      value={form.officeAddress} onChange={e => set('officeAddress', e.target.value)}
                      placeholder="Station / Office address" />
                  </div>

                  <div
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
                  >
                    <span className="text-lg">🔒</span>
                    <p className="text-xs text-slate-400">
                      Your official credentials are verified by the SafeTrail admin before
                      granting full dashboard access.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 2: Confirm ── */}
              {step === 2 && (
                <div>
                  <h2 className="font-syne font-bold text-white text-lg mb-4">Confirm & Register</h2>
                  <div
                    className="rounded-xl p-4 space-y-3 mb-4"
                    style={{ background: '#0d1525', border: '1px solid rgba(99,102,241,0.12)' }}
                  >
                    {([
                      ['Authority Type', `${selectedRole.emoji} ${selectedRole.label}`],
                      ['Name',           form.name],
                      ['Email',          form.email],
                      ['Phone',          form.phone],
                      ['Department',     form.department],
                      ['Designation',    form.designation],
                      ...(form.badgeNumber ? [['Badge / ID', form.badgeNumber] as [string,string]] : []),
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className="text-xs text-white font-medium text-right max-w-[55%] truncate">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex items-start gap-3 p-3 rounded-xl mb-2"
                    style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}
                  >
                    <span className="text-base">⚠️</span>
                    <p className="text-xs text-amber-300">
                      By registering, you confirm that the details provided are accurate and
                      you are an authorized official of the mentioned organization.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20
                  rounded-lg px-3 py-2">{error}</div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button
                    onClick={back}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400
                      transition-all hover:text-white"
                    style={{ background: '#0d1525', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    ← Back
                  </button>
                )}

                {step < 2 ? (
                  <button
                    onClick={next}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#38bdf8)' }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleRegister} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#38bdf8)' }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending OTP…
                      </span>
                    ) : '📧 Send OTP & Register'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Links */}
        <div className="text-center mt-5 space-y-1">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign In
            </Link>
          </p>
          <p className="text-xs text-slate-600">
            Registering as a tourist instead?{' '}
            <Link href="/auth/register" className="text-sky-400 hover:text-sky-300 font-medium">
              Tourist Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}