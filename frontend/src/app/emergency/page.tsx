'use client'
import { useEffect, useRef, useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import { usePathname, useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { useAlerts } from '@/hooks/useAlerts'
import { timeAgo, alertTypeIcon } from '@/lib/utils'
import Badge from '@/components/shared/Badge'
import ToastContainer, { toast } from '@/components/shared/Toast'
import { dispatchSOS } from '@/lib/sosNotify'

/* ─────────────── nav config ─────────────── */
const NAV_MAIN = [
  { href: '/dashboard',    icon: '🏠', label: 'Dashboard'     },
  { href: '/tracking',     icon: '📍', label: 'Live Tracking' },
  { href: '/emergency',    icon: '🆘', label: 'Emergency',    badge: '!' },
  { href: '/places',       icon: '🏛️', label: 'Nearby Places' },
]
const NAV_EXPLORE = [
  { href: '/tour-picks',   icon: '🗺️', label: 'Tour Picks'   },
  { href: '/weather',      icon: '⛅',  label: 'Weather'      },
  { href: '/ai-assistant', icon: '🤖', label: 'AI Assistant' },
]
const NAV_ACCOUNT = [
  { href: '/profile',  icon: '👤', label: 'My Profile' },
  { href: '/settings', icon: '⚙️', label: 'Settings'   },
]

const SERVICES = [
  { name: 'Police Control',   number: '100',  color: '#3B82F6', bg: '#EFF6FF', desc: 'Report crime / emergency' },
  { name: 'Ambulance',        number: '108',  color: '#10B981', bg: '#F0FDF4', desc: 'Medical emergency' },
  { name: 'Fire Brigade',     number: '101',  color: '#F59E0B', bg: '#FFFBEB', desc: 'Fire incidents' },
  { name: 'Tourist Helpline', number: '1363', color: '#8B5CF6', bg: '#F5F3FF', desc: 'Tourism India helpline' },
  { name: 'Women Helpline',   number: '1091', color: '#EC4899', bg: '#FDF2F8', desc: 'Women in distress' },
  { name: 'Disaster Mgmt',    number: '108',  color: '#F97316', bg: '#FFF7ED', desc: 'NDRF / SDRF' },
]

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = getUser()
  const initials = (user?.name ?? 'TU')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  type NavItem = { href: string; icon: string; label: string; badge?: string }
  const NavGroup = ({ label, items }: { label: string; items: NavItem[] }) => (
    <>
      <p style={S.navLabel}>{label}</p>
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <div
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{ ...S.navItem, background: active ? '#1D4ED8' : 'transparent', cursor: 'pointer' }}
            role="link" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && router.push(item.href)}
          >
            <span style={S.navIcon}>{item.icon}</span>
            <span style={{ ...S.navText, color: active ? '#fff' : '#94A3B8' }}>{item.label}</span>
            {item.badge && <span style={S.navBadge}>{item.badge}</span>}
          </div>
        )
      })}
    </>
  )

  return (
    <aside style={S.sidebar}>
      <div style={S.sbBrand}>
        <div style={S.sbLogo}>🛡️</div>
        <div>
          <p style={S.sbName}>SafeTrail</p>
          <p style={S.sbSub}>Tourist Safety Platform</p>
        </div>
      </div>
      <nav style={S.sbNav}>
        <NavGroup label="Main"    items={NAV_MAIN}    />
        <NavGroup label="Explore" items={NAV_EXPLORE} />
        <NavGroup label="Account" items={NAV_ACCOUNT} />
      </nav>
      <div style={S.sbFooter}>
        <div style={S.sbUser}>
          <div style={S.sbAvatar}>{initials}</div>
          <div>
            <p style={S.sbUname}>{user?.name ?? 'Traveller'}</p>
            <p style={S.sbUrole}>Tourist · Active</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ════════════════════════════════════════
   EMERGENCY CONTENT
════════════════════════════════════════ */
function EmergencyContent() {
  const { alerts: rawAlerts } = useAlerts()
  const alerts = Array.isArray(rawAlerts) ? rawAlerts : []

  const [sosState, setSOSState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const panicSent    = sosState === 'sent'
  const panicLoading = sosState === 'loading'

  const locationRef  = useRef<{ lat: number; lng: number }>({ lat: 19.8762, lng: 75.3433 })
  const isSendingRef = useRef(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const triggerPanic = async () => {
    if (sosState !== 'idle' || isSendingRef.current) return
    isSendingRef.current = true
    setSOSState('loading')

    const { lat, lng } = locationRef.current
    const result = await dispatchSOS({
      latitude:  lat,
      longitude: lng,
      timestamp: new Date().toISOString(),
    })

    isSendingRef.current = false

    if (result.errors.length > 0 && result.notified.length === 0) {
      setSOSState('error')
      toast.error('❌ SOS could not be sent. Please call 112 directly.')
      console.error('[SOS] errors:', result.errors)
    } else {
      setSOSState('sent')
      const n = result.notified.length
      if (result.errors.length > 0) {
        toast.error(`🚨 SOS sent! ${n} email notification(s) dispatched.`)
        console.warn('[SOS] partial errors:', result.errors)
      } else {
        toast.error(`🚨 SOS sent! Authorities + ${n} contact(s) notified by email.`)
      }
    }
  }

  const resetSOS = () => setSOSState('idle')

  const btnBackground = panicSent
    ? 'linear-gradient(135deg,#10B981,#059669)'
    : sosState === 'error'
      ? 'linear-gradient(135deg,#F97316,#B45309)'
      : 'linear-gradient(135deg,#EF4444,#BE123C)'

  const btnBoxShadow = panicSent
    ? '0 0 0 6px rgba(16,185,129,0.15), 0 8px 32px rgba(16,185,129,0.35)'
    : sosState === 'error'
      ? '0 0 0 6px rgba(249,115,22,0.15), 0 8px 32px rgba(249,115,22,0.45)'
      : '0 0 0 6px rgba(239,68,68,0.15), 0 8px 32px rgba(239,68,68,0.45)'

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>
        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>Emergency</h1>
            <p style={S.tbSub}>SOS · Alert Services · Incident Reports</p>
          </div>
          <div style={S.tbRight}>
            <span style={{ ...S.pill, ...S.pillRed }}>
              <span style={S.pulseDot} /> Emergency Active
            </span>
          </div>
        </div>

        <main style={S.content}>

          {/* ── SOS Panel ── */}
          <div style={S.sosPanel}>
            {/* Top accent bar */}
            <div style={S.sosAccent} />

            {/* Title */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Emergency SOS
              </h2>
              <p style={{ fontSize: 11, color: '#64748B', margin: '6px 0 0' }}>
                Press only in case of real emergency — alerts authorities &amp; emails your emergency contacts
              </p>
            </div>

            {/* ── Rings + SOS Button ── */}
            <div style={S.sosRingWrapper}>
              {/* Animated rings — only when idle */}
              {sosState === 'idle' && (
                <>
                  <div style={{ ...S.ring, width: 220, height: 220, animationDelay: '0s'   }} />
                  <div style={{ ...S.ring, width: 190, height: 190, animationDelay: '0.4s' }} />
                  <div style={{ ...S.ring, width: 160, height: 160, animationDelay: '0.8s' }} />
                </>
              )}

              <button
                onClick={triggerPanic}
                disabled={panicLoading}
                aria-label="Send SOS emergency alert"
                style={{
                  position:       'relative',
                  zIndex:         10,
                  width:          120,
                  height:         120,
                  borderRadius:   '50%',
                  border:         'none',
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            4,
                  cursor:         panicLoading ? 'not-allowed' : 'pointer',
                  fontWeight:     800,
                  color:          '#fff',
                  transition:     'transform 0.2s, box-shadow 0.2s',
                  transform:      panicLoading ? 'scale(0.95)' : 'scale(1)',
                  background:     btnBackground,
                  boxShadow:      btnBoxShadow,
                  flexShrink:     0,
                }}
              >
                {panicLoading ? (
                  <>
                    <div style={S.spinner} />
                    <span style={{ fontSize: 9, letterSpacing: 1 }}>SENDING…</span>
                  </>
                ) : panicSent ? (
                  <>
                    <span style={{ fontSize: 28 }}>✓</span>
                    <span style={{ fontSize: 12, letterSpacing: 2 }}>SENT</span>
                  </>
                ) : sosState === 'error' ? (
                  <>
                    <span style={{ fontSize: 26 }}>⚠️</span>
                    <span style={{ fontSize: 11, letterSpacing: 1 }}>RETRY</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 28 }}>🆘</span>
                    <span style={{ fontSize: 16, letterSpacing: 2 }}>SOS</span>
                  </>
                )}
              </button>
            </div>

            {/* Status text */}
            {panicSent ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', margin: 0 }}>
                  ✅ Alert sent successfully!
                </p>
                <p style={{ fontSize: 11, color: '#64748B', margin: '4px 0 0' }}>
                  Emails sent to your registered address, emergency contacts &amp; admin
                </p>
                <button onClick={resetSOS} style={S.resetBtn}>Reset SOS</button>
              </div>
            ) : sosState === 'error' ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#B45309', margin: 0 }}>
                  ⚠️ Alert could not be sent
                </p>
                <p style={{ fontSize: 11, color: '#64748B', margin: '4px 0 0' }}>
                  Please call <strong>112</strong> directly. Tap button to retry.
                </p>
                <button onClick={resetSOS} style={S.resetBtn}>Reset</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={S.pulseDot} />
                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                  Ready — emails tourist · emergency contacts · admin on trigger
                </span>
              </div>
            )}

            {/* 112 fallback */}
            <div style={S.callBar}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#BE123C', margin: 0 }}>📞 National Emergency</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>Works on all networks, even without data</p>
              </div>
              <a href="tel:112" style={S.callBtn}>Call 112</a>
            </div>
          </div>

          {/* ── Emergency Services ── */}
          <section>
            <p style={S.secLabel}>Emergency Services</p>
            <div style={S.servicesGrid}>
              {SERVICES.map((s, i) => (
                <a key={i} href={`tel:${s.number}`}
                  style={{ ...S.serviceCard, background: s.bg, border: `0.5px solid ${s.color}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 20, color: s.color }}>{s.number}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: s.color, color: '#fff' }}>TAP TO CALL</span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', margin: '8px 0 2px' }}>{s.name}</p>
                  <p style={{ fontSize: 10, color: '#64748B', margin: 0 }}>{s.desc}</p>
                </a>
              ))}
            </div>
          </section>

          {/* ── Recent Incidents ── */}
          <section>
            <p style={S.secLabel}>Recent Incidents</p>
            <div style={S.incidentBox}>
              {alerts.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>✅ No recent incidents</p>
                </div>
              ) : alerts.slice(0, 8).map((a: any) => (
                <div key={a.id} style={S.incidentRow}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{alertTypeIcon(a.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                    <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <Badge variant={a.priority.toLowerCase() as 'high' | 'medium' | 'low'}>{a.priority}</Badge>
                    <span style={{ fontSize: 9, color: '#CBD5E1' }}>{timeAgo(a.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: 16 }} />
        </main>
      </div>

      <ToastContainer />

      <style>{`
        @keyframes sosPing {
          0%   { transform: translate(-50%, -50%) scale(0.85); opacity: 0.6; }
          70%  { transform: translate(-50%, -50%) scale(1.15); opacity: 0;   }
          100% { transform: translate(-50%, -50%) scale(0.85); opacity: 0;   }
        }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */
const S: Record<string, React.CSSProperties> = {
  root:     { display: 'flex', height: '100vh', overflow: 'hidden', background: '#F8FAFC', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
  sidebar:  { width: 220, background: '#0F172A', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '0.5px solid #1E293B' },
  sbBrand:  { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 16px', borderBottom: '0.5px solid #1E293B' },
  sbLogo:   { width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3B82F6,#06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 },
  sbName:   { fontSize: 13, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.2px', margin: 0 },
  sbSub:    { fontSize: 10, color: '#475569', margin: 0 },
  sbNav:    { flex: 1, overflowY: 'auto', padding: '12px 8px', scrollbarWidth: 'thin', scrollbarColor: '#1E293B transparent' },
  navLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#334155', padding: '12px 8px 6px', textTransform: 'uppercase', margin: 0 },
  navItem:  { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 2, transition: 'background 0.15s' },
  navIcon:  { width: 28, height: 28, borderRadius: 6, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 },
  navText:  { fontSize: 12, fontWeight: 500 },
  navBadge: { marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#EF4444', color: '#fff' },
  sbFooter: { padding: '12px 8px', borderTop: '0.5px solid #1E293B' },
  sbUser:   { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' },
  sbAvatar: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 },
  sbUname:  { fontSize: 11, fontWeight: 600, color: '#CBD5E1', margin: 0 },
  sbUrole:  { fontSize: 9, color: '#475569', margin: 0 },
  main:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderBottom: '0.5px solid #E2E8F0', flexShrink: 0 },
  tbTitle:  { fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 },
  tbSub:    { fontSize: 11, color: '#64748B', margin: 0 },
  tbRight:  { display: 'flex', alignItems: 'center', gap: 8 },
  pill:     { display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99 },
  pillRed:  { background: '#FFF1F2', color: '#BE123C', border: '0.5px solid #FECDD3' },
  pulseDot: { width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'blink 1.5s infinite', flexShrink: 0 },
  content:  { flex: 1, overflowY: 'auto', padding: '18px 20px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 16, scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' },

  /* ── SOS Panel: key fix — explicit height so the ring wrapper has room ── */
  sosPanel: {
    background:     '#fff',
    borderRadius:   14,
    border:         '0.5px solid #FECDD3',
    padding:        '20px 22px',
    position:       'relative',
    overflow:       'visible',          /* was 'hidden' — clipped the rings */
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            12,
  },
  sosAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg,#EF4444,#F97316,#EF4444)' },

  /* ── Ring wrapper: explicit size + position:relative so absolute rings work ── */
  sosRingWrapper: {
    position:       'relative',
    width:          240,
    height:         240,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },

  /* ── Rings: centred via top/left 50% + translate ── */
  ring: {
    position:     'absolute',
    top:          '50%',
    left:         '50%',
    /* transform is overridden per-ring via animationDelay but base must centre */
    transform:    'translate(-50%, -50%)',
    borderRadius: '50%',
    border:       '2px solid rgba(239,68,68,0.3)',
    animation:    'sosPing 2s ease-out infinite',
  },

  spinner:  { width: 26, height: 26, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  resetBtn: { marginTop: 10, fontSize: 11, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
  callBar:  { width: '100%', padding: '10px 14px', borderRadius: 10, background: '#FFF1F2', border: '0.5px solid #FECDD3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' },
  callBtn:  { padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 800, color: '#fff', background: '#EF4444', textDecoration: 'none', flexShrink: 0 },
  secLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 10px' },
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 },
  serviceCard:  { borderRadius: 12, padding: '14px', textDecoration: 'none', display: 'block', transition: 'transform 0.15s', cursor: 'pointer' },
  incidentBox:  { borderRadius: 12, border: '0.5px solid #E2E8F0', background: '#fff', overflow: 'hidden' },
  incidentRow:  { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '0.5px solid #F1F5F9' },
}

export default function EmergencyPage() {
  return <AuthGuard><EmergencyContent /></AuthGuard>
}