'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { setAuth } from '@/lib/auth'
import { AuthResponse, UserRole } from '@/types'

/* ── Role config ── */
const ROLES: { value: UserRole; label: string; icon: string; accent: string; bg: string }[] = [
  { value: 'TOURIST',    label: 'Tourist',    icon: '🧳', accent: '#059669', bg: '#ECFDF5' },
  { value: 'TOUR_GUIDE', label: 'Tour Guide', icon: '🗺️', accent: '#D97706', bg: '#FFFBEB' },
  { value: 'AUTHORITY',  label: 'Authority',  icon: '👮', accent: '#7C3AED', bg: '#F5F3FF' },
]

interface FormData {
  name: string; email: string; password: string; phone: string; nationality: string
  role: UserRole
  idProofType: string; idProofNumber: string
  emergencyContactName: string; emergencyContactPhone: string; emergencyContactRelation: string
  badgeNumber: string; department: string; jurisdiction: string
  guideId: string; specialization: string
}

const ID_TYPES = ['PASSPORT', 'AADHAAR', 'DRIVING_LICENSE', 'VOTER_ID']

const getSteps = (role: UserRole) => {
  const base = ['Role', 'Personal']
  if (role === 'TOURIST')    return [...base, 'Identity', 'Emergency', 'Confirm']
  if (role === 'AUTHORITY')  return [...base, 'Badge', 'Confirm']
  if (role === 'TOUR_GUIDE') return [...base, 'Guide Info', 'Confirm']
  return [...base, 'Confirm']
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp]         = useState('')
  const [savedPayload, setSavedPayload] = useState<object | null>(null)

  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', phone: '', nationality: '',
    role: 'TOURIST',
    idProofType: 'PASSPORT', idProofNumber: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    badgeNumber: '', department: '', jurisdiction: '',
    guideId: '', specialization: '',
  })

  const STEPS = getSteps(form.role)
  const set   = (key: keyof FormData, value: string) => setForm((f) => ({ ...f, [key]: value }))
  const roleMeta = ROLES.find(r => r.value === form.role)!

  const validateStep = (): boolean => {
    setError('')
    if (step === 0) return true
    if (step === 1) {
      if (!form.name.trim())        { setError('Name is required'); return false }
      if (!form.email.trim())       { setError('Email is required'); return false }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return false }
      if (!form.phone.trim())       { setError('Phone is required'); return false }
    }
    if (form.role === 'TOURIST') {
      if (step === 2 && !form.idProofNumber.trim()) { setError('ID number is required'); return false }
      if (step === 3 && !form.emergencyContactName.trim()) { setError('Emergency contact name is required'); return false }
    }
    if (form.role === 'AUTHORITY' && step === 2) {
      if (!form.badgeNumber.trim()) { setError('Badge number is required'); return false }
      if (!form.department.trim())  { setError('Department is required'); return false }
    }
    if (form.role === 'TOUR_GUIDE' && step === 2) {
      if (!form.specialization.trim()) { setError('Specialization is required'); return false }
    }
    return true
  }

  const next = () => { if (validateStep()) setStep((s) => s + 1) }
  const back = () => { setError(''); setStep((s) => s - 1) }

  const buildPayload = () => {
    const base = { name: form.name, email: form.email, password: form.password, phone: form.phone, role: form.role }
    if (form.role === 'TOURIST') return { ...base, nationality: form.nationality, passportNo: form.idProofNumber, emergencyContactName: form.emergencyContactName, emergencyContactPhone: form.emergencyContactPhone, emergencyContactRelation: form.emergencyContactRelation }
    if (form.role === 'AUTHORITY') return { ...base, badgeNumber: form.badgeNumber, department: form.department, jurisdiction: form.jurisdiction }
    if (form.role === 'TOUR_GUIDE') return { ...base, guideId: form.guideId, specialization: form.specialization }
    return base
  }

  const handleRegister = async () => {
    setLoading(true); setError('')
    try {
      const payload = buildPayload()
      await authApi.register(payload)
      setSavedPayload(payload)
      setOtpSent(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError('Please enter the OTP'); return }
    setLoading(true); setError('')
    try {
      const res  = await authApi.verifyRegister(form.email, otp, savedPayload!)
      const data: AuthResponse = res.data?.data ?? res.data
      const userId = data.userId ?? (data as unknown as { id?: number }).id
      if (!userId) { setError('Registration succeeded but no user ID returned. Please log in.'); return }
      const user = { id: userId, name: form.name, email: form.email, role: (data.role ?? form.role) as UserRole, touristId: data.touristId ?? data.profileId ?? null }
      setAuth(data.token, user)
      router.replace('/')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={S.root}>
      <div style={S.bg} />

      <div style={S.wrapper}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.logoWrap}>
            <div style={S.logo}>🛡️</div>
          </div>
          <h1 style={S.brand}>{otpSent ? 'Verify Email' : 'Create Account'}</h1>
          <p style={S.brandSub}>
            {otpSent
              ? `OTP sent to ${form.email}`
              : step === 0
                ? 'Choose your account type to get started'
                : `Registering as ${roleMeta.icon} ${roleMeta.label}`}
          </p>
        </div>

        {/* Step indicator */}
        {!otpSent && (
          <div style={S.stepWrap}>
            {STEPS.map((label, i) => (
              <div key={i} style={S.stepItem}>
                <div style={S.stepLineWrap}>
                  <div style={{ ...S.stepLine, visibility: i === 0 ? 'hidden' : 'visible', background: i <= step ? '#3B82F6' : '#E2E8F0' }} />
                  <div style={{ ...S.stepDot, background: i <= step ? '#3B82F6' : '#E2E8F0', boxShadow: i === step ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none' }} />
                  <div style={{ ...S.stepLine, visibility: i === STEPS.length - 1 ? 'hidden' : 'visible', background: i < step ? '#3B82F6' : '#E2E8F0' }} />
                </div>
                <span style={{ ...S.stepLabel, color: i <= step ? '#3B82F6' : '#CBD5E1' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={S.card}>

          {/* OTP screen */}
          {otpSent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={S.infoBox}>
                <span style={{ fontSize: 16 }}>✉️</span>
                <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>
                  We sent a 6-digit OTP to{' '}
                  <span style={{ color: '#059669', fontWeight: 600 }}>{form.email}</span>. Check your inbox.
                </p>
              </div>
              <div>
                <label style={S.label}>Enter OTP</label>
                <input
                  type="text" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  maxLength={6}
                  style={{ ...S.input, letterSpacing: 4, fontSize: 16, fontWeight: 600 }}
                />
              </div>
              {error && <div style={S.errorBox}>{error}</div>}
              <button onClick={handleVerifyOtp} disabled={loading} style={S.btnPrimary}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={S.spinner} />Verifying…</span>
                  : '✅ Verify & Complete Registration'}
              </button>
              <button onClick={() => { setOtpSent(false); setOtp(''); setError('') }} style={S.btnGhost}>
                ← Go back and edit details
              </button>
            </div>

          ) : (
            <>
              {/* Step 0: Role selector */}
              {step === 0 && (
                <div>
                  <p style={S.stepTitle}>Select your role</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => set('role', r.value)}
                        style={{
                          ...S.roleBtn,
                          background: form.role === r.value ? r.bg : '#FAFAFA',
                          border: `0.5px solid ${form.role === r.value ? r.accent + '60' : '#E2E8F0'}`,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{r.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: form.role === r.value ? r.accent : '#475569' }}>
                          {r.label}
                        </span>
                        {form.role === r.value && (
                          <svg style={{ width: 14, height: 14, marginLeft: 'auto', color: r.accent, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Personal info */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={S.stepTitle}>Personal information</p>
                  {[
                    { key: 'name',     label: 'Full Name',     type: 'text',     placeholder: 'Jane Doe' },
                    { key: 'email',    label: 'Email Address', type: 'email',    placeholder: 'you@example.com' },
                    { key: 'password', label: 'Password',      type: 'password', placeholder: 'Min. 6 characters' },
                    { key: 'phone',    label: 'Phone Number',  type: 'tel',      placeholder: '9876543210' },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label style={S.label}>{label}</label>
                      <input type={type} style={S.input} value={form[key as keyof FormData]}
                        onChange={(e) => set(key as keyof FormData, e.target.value)}
                        placeholder={placeholder} />
                    </div>
                  ))}
                  {form.role === 'TOURIST' && (
                    <div>
                      <label style={S.label}>Nationality</label>
                      <input style={S.input} value={form.nationality}
                        onChange={(e) => set('nationality', e.target.value)} placeholder="Indian" />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Role-specific */}
              {step === 2 && form.role === 'TOURIST' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={S.stepTitle}>Identity proof</p>
                  <div>
                    <label style={S.label}>ID Type</label>
                    <select style={S.input} value={form.idProofType}
                      onChange={(e) => set('idProofType', e.target.value)}>
                      {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>ID Number</label>
                    <input style={S.input} value={form.idProofNumber}
                      onChange={(e) => set('idProofNumber', e.target.value)} placeholder="Enter your ID number" />
                  </div>
                  <div style={{ ...S.infoBox, background: '#F0F9FF', border: '0.5px solid #BAE6FD' }}>
                    <span style={{ fontSize: 14 }}>🔒</span>
                    <p style={{ fontSize: 11, color: '#0369A1', margin: 0 }}>Your ID details are encrypted and never shared.</p>
                  </div>
                </div>
              )}

              {step === 2 && form.role === 'AUTHORITY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={S.stepTitle}>Badge details</p>
                  {[
                    { key: 'badgeNumber',  label: 'Badge Number', placeholder: 'eg. B-1234' },
                    { key: 'department',   label: 'Department',   placeholder: 'eg. Traffic Police' },
                    { key: 'jurisdiction', label: 'Jurisdiction', placeholder: 'eg. Pune District' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={S.label}>{label}</label>
                      <input style={S.input} value={form[key as keyof FormData]}
                        onChange={(e) => set(key as keyof FormData, e.target.value)} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && form.role === 'TOUR_GUIDE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={S.stepTitle}>Guide details</p>
                  {[
                    { key: 'guideId',        label: 'Guide ID (optional)', placeholder: 'eg. TG-2024-001' },
                    { key: 'specialization', label: 'Specialization',      placeholder: 'eg. Heritage & Forts' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={S.label}>{label}</label>
                      <input style={S.input} value={form[key as keyof FormData]}
                        onChange={(e) => set(key as keyof FormData, e.target.value)} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3: Emergency contact (Tourist only) */}
              {step === 3 && form.role === 'TOURIST' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={S.stepTitle}>Emergency contact</p>
                  {[
                    { key: 'emergencyContactName',     label: 'Contact Name',  placeholder: 'Anushka Khonde' },
                    { key: 'emergencyContactPhone',    label: 'Contact Phone', placeholder: '9876543210' },
                    { key: 'emergencyContactRelation', label: 'Relationship',  placeholder: 'Sister, Parent…' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={S.label}>{label}</label>
                      <input style={S.input} value={form[key as keyof FormData]}
                        onChange={(e) => set(key as keyof FormData, e.target.value)} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm step */}
              {step === STEPS.length - 1 && (
                <div>
                  <p style={S.stepTitle}>Confirm & register</p>
                  <div style={S.confirmBox}>
                    <div style={S.confirmRow}>
                      <span style={S.confirmKey}>Role</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                        background: roleMeta.bg, color: roleMeta.accent,
                      }}>
                        {roleMeta.icon} {roleMeta.label}
                      </span>
                    </div>
                    {([
                      ['Name',  form.name],
                      ['Email', form.email],
                      ['Phone', form.phone],
                      ...(form.role === 'TOURIST'
                        ? [['Nationality', form.nationality], ['ID Type', form.idProofType], ['Emergency Contact', form.emergencyContactName]]
                        : form.role === 'AUTHORITY'
                        ? [['Badge No.', form.badgeNumber], ['Department', form.department]]
                        : form.role === 'TOUR_GUIDE'
                        ? [['Specialization', form.specialization]]
                        : []),
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} style={{ ...S.confirmRow, borderTop: '0.5px solid #F1F5F9' }}>
                        <span style={S.confirmKey}>{label}</span>
                        <span style={S.confirmVal}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <div style={{ ...S.errorBox, marginTop: 12 }}>{error}</div>}

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                {step > 0 && (
                  <button onClick={back} style={S.btnSecondary}>← Back</button>
                )}
                {step < STEPS.length - 1 ? (
                  <button onClick={next} style={{ ...S.btnPrimary, flex: 1 }}>Next →</button>
                ) : (
                  <button onClick={handleRegister} disabled={loading} style={{ ...S.btnPrimary, flex: 1 }}>
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={S.spinner} />Sending OTP…</span>
                      : '📧 Send OTP & Register'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
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
    maxWidth: 440,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 12,
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
    fontSize: 22,
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
  stepWrap: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: '0 4px',
  },
  stepItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  stepLineWrap: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.2s, box-shadow 0.2s',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.2px',
    transition: 'color 0.2s',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '0.5px solid #E2E8F0',
    padding: '24px 28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.2px',
    margin: '0 0 16px',
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
  roleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.15s',
    width: '100%',
    textAlign: 'left',
  },
  errorBox: {
    fontSize: 12,
    color: '#BE123C',
    background: '#FFF1F2',
    border: '0.5px solid #FECDD3',
    borderRadius: 8,
    padding: '9px 12px',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    background: '#F0FDF4',
    border: '0.5px solid #BBF7D0',
    borderRadius: 8,
  },
  confirmBox: {
    background: '#FAFAFA',
    border: '0.5px solid #E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  confirmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 12px',
  },
  confirmKey: {
    fontSize: 11,
    color: '#94A3B8',
  },
  confirmVal: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0F172A',
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
  },
  btnSecondary: {
    flex: 1,
    padding: '11px 0',
    borderRadius: 9,
    border: '0.5px solid #E2E8F0',
    background: '#FAFAFA',
    color: '#64748B',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
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