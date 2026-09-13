'use client'
import AuthGuard from '@/components/layout/AuthGuard'
import ToastContainer from '@/components/shared/Toast'
import { useLocation } from '@/hooks/useLocation'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getUser } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { authorityApi, alertApi } from '@/lib/api'

/* ─────────────── nav config ─────────────── */
const NAV_MAIN = [
  { href: '/dashboard/authority', icon: '🏠', label: 'Dashboard'       },
  { href: '/tracking',            icon: '📍', label: 'Live Tracking'   },
  { href: '/emergency',           icon: '🆘', label: 'Emergency', badge: '!' },
  { href: '/authority',           icon: '👮', label: 'Authority Panel' },
]
const NAV_EXPLORE = [
  { href: '/weather',      icon: '⛅',  label: 'Weather'      },
  { href: '/ai-assistant', icon: '🤖', label: 'AI Assistant' },
]
const NAV_ACCOUNT = [
  { href: '/profile',  icon: '👤', label: 'My Profile' },
  { href: '/settings', icon: '⚙️', label: 'Settings'   },
]

const AUTH_TABS = ['Tourists', 'Alerts', 'Zones', 'Broadcast']

const ZONES = [
  { name: 'Hazur Sahib Gurudwara',    pct: 72, color: '#F59E0B' },
  { name: 'Nandgiri Fort',            pct: 58, color: '#10B981' },
  { name: 'Guru Gobind Singh Museum', pct: 34, color: '#10B981' },
  { name: 'Triangle Spot (Ghat)',     pct: 89, color: '#EF4444' },
  { name: 'Shri Khandoba Mandir',     pct: 45, color: '#10B981' },
  { name: 'Godavari Riverside',       pct: 61, color: '#10B981' },
]

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = getUser()
  const initials = (user?.name ?? 'AU')
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
            style={{
              ...S.navItem,
              background: active ? 'linear-gradient(90deg,#7C3AED,#6D28D9)' : 'transparent',
              cursor: 'pointer',
              boxShadow: active ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
            }}
            role="link" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && router.push(item.href)}
          >
            <span style={{
              ...S.navIcon,
              background: active ? 'rgba(255,255,255,0.15)' : '#1E293B',
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: 12, fontWeight: active ? 600 : 500,
              color: active ? '#fff' : '#94A3B8',
              letterSpacing: '-0.1px', fontFamily: FONT,
            }}>
              {item.label}
            </span>
            {item.badge && <span style={S.navBadge}>{item.badge}</span>}
            {active && <span style={S.navActiveDot} />}
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
      <div style={S.sbAuthBadge}>
        <span style={S.sbAuthDot} />
        Authority Access
      </div>
      <div style={S.sbFooter}>
        <div style={S.sbUser}>
          <div style={S.sbAvatar}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={S.sbUname}>{user?.name ?? 'Authority'}</p>
            <p style={S.sbUrole}>Authority · Active</p>
          </div>
          <span style={S.sbOnlineDot} />
        </div>
      </div>
    </aside>
  )
}

/* ════════════════════════════════════════
   AUTHORITY DASHBOARD
════════════════════════════════════════ */
function AuthorityDashboard() {
  useLocation(true)
  useWebSocket(true)

  const [activeTab,   setActiveTab]   = useState('Tourists')
  const [time,        setTime]        = useState('')
  const [tourists,    setTourists]    = useState<any[]>([])
  const [alerts,      setAlerts]      = useState<any[]>([])
  const [broadcast,   setBroadcast]   = useState('')
  const [loadingData, setLoadingData] = useState(true)

  /* clock */
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /* fetch data */
  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, aRes] = await Promise.all([
          authorityApi.getAllTourists().catch(() => ({ data: [] })),
          alertApi.getActive().catch(() => ({ data: [] })),
        ])
        setTourists(Array.isArray(tRes.data) ? tRes.data : tRes.data?.data ?? [])
        setAlerts(Array.isArray(aRes.data)   ? aRes.data : aRes.data?.data ?? [])
      } catch { /* silent */ }
      finally { setLoadingData(false) }
    }
    load()
  }, [])

  const sosCount    = tourists.filter((t: any) => t.status === 'SOS').length
  const activeCount = tourists.filter((t: any) => t.status === 'ACTIVE').length
  const alertCount  = alerts.filter((a: any) => a.status === 'ACTIVE').length

  const STATS = [
    { icon: '👥', label: 'Total Tourists', labelColor: '#6366F1', value: String(tourists.length || '—'), sub: `${activeCount} active`,                                    subColor: '#10B981' },
    { icon: '⚠️', label: 'Active Alerts',  labelColor: '#F59E0B', value: String(alertCount  || '0'),    sub: 'Needs attention',                                            subColor: alertCount  > 0 ? '#EF4444' : '#10B981' },
    { icon: '🆘', label: 'In Emergency',   labelColor: '#EF4444', value: String(sosCount    || '0'),    sub: sosCount > 0 ? 'SOS active!' : 'No active SOS',               subColor: sosCount > 0 ? '#EF4444' : '#10B981' },
    { icon: '🛡️', label: 'Safe Zones',    labelColor: '#10B981', value: String(ZONES.length),          sub: 'All monitored',                                              subColor: '#059669' },
  ]

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '—'
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    return `${Math.floor(m / 60)}h ago`
  }

  const resolveAlert = async (id: number) => {
    try {
      await alertApi.resolve(id)
      setAlerts(prev => prev.filter((a: any) => a.id !== id))
    } catch { /* silent */ }
  }

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>
        {/* topbar */}
        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>Authority Dashboard</h1>
            <p style={S.tbSub}>Tourist Registry · Alerts · Zone Control — Nanded, Maharashtra</p>
          </div>
          <div style={S.tbRight}>
            <span style={S.tbTime}>{time}</span>
            <span style={{ ...S.pill, ...S.pillPurple }}>
              <span style={{ ...S.dot, background: '#A855F7' }} /> Authority Access
            </span>
            <span style={{ ...S.pill, ...S.pillGreen }}>
              <span style={{ ...S.dot, background: '#22C55E' }} /> System Online
            </span>
          </div>
        </div>

        <main style={S.content}>

          {/* Stats */}
          <section>
            <p style={S.secLabel}>System at a glance</p>
            <div style={S.statsGrid}>
              {STATS.map((s) => (
                <div key={s.label} style={S.statCard}>
                  <div style={S.scIcon}>{s.icon}</div>
                  <p style={{ ...S.scLabel, color: s.labelColor }}>{s.label}</p>
                  <p style={{ ...S.scVal, fontSize: s.value.length > 4 ? 17 : 28 }}>{s.value}</p>
                  <p style={{ ...S.scSub, color: s.subColor }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Zone capacity */}
          <section>
            <p style={S.secLabel}>Zone capacity overview — Nanded</p>
            <div style={S.zoneGrid}>
              {ZONES.map((z) => (
                <div key={z.name} style={S.zoneCard}>
                  <div style={S.zoneTop}>
                    <p style={S.zoneName}>{z.name}</p>
                    <p style={{ ...S.zonePct, color: z.color }}>{z.pct}%</p>
                  </div>
                  <div style={S.zoneBar}>
                    <div style={{ ...S.zoneBarFill, width: `${z.pct}%`, background: z.color }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Authority Panel */}
          <section>
            <p style={S.secLabel}>Authority panel</p>
            <div style={S.authCard}>
              <div style={S.authHeader}>
                <div>
                  <h3 style={S.authTitle}>👮 Authority Panel</h3>
                  <p style={S.authSub}>Tourist Registry · Alerts · Zone Control</p>
                </div>
              </div>

              {/* Tabs */}
              <div style={S.tabRow}>
                {AUTH_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      ...S.tab,
                      background: activeTab === t ? 'linear-gradient(90deg,#7C3AED,#6D28D9)' : 'transparent',
                      color:      activeTab === t ? '#fff'    : '#64748B',
                      border:     activeTab === t ? 'none'    : '0.5px solid #E2E8F0',
                      boxShadow:  activeTab === t ? '0 2px 8px rgba(124,58,237,0.2)' : 'none',
                    }}
                  >
                    {t === 'Tourists'  && '👥 '}
                    {t === 'Alerts'    && '🔔 '}
                    {t === 'Zones'     && '🛡️ '}
                    {t === 'Broadcast' && '📢 '}
                    {t}
                    {t === 'Tourists' && <span style={S.tabBadge}>{tourists.length}</span>}
                    {t === 'Alerts'   && <span style={{ ...S.tabBadge, background: 'rgba(255,255,255,0.25)' }}>{alertCount}</span>}
                    {t === 'Zones'    && <span style={{ ...S.tabBadge, background: 'rgba(255,255,255,0.25)' }}>{ZONES.length}</span>}
                  </button>
                ))}
              </div>

              {/* Tourists tab */}
              {activeTab === 'Tourists' && (
                <div style={{ overflowX: 'auto' }}>
                  {loadingData ? (
                    <p style={{ fontSize: 12, color: '#94A3B8', padding: '20px 0', textAlign: 'center', fontFamily: FONT }}>Loading tourists…</p>
                  ) : tourists.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#94A3B8', padding: '20px 0', textAlign: 'center', fontFamily: FONT }}>No tourists found</p>
                  ) : (
                    <table style={S.table}>
                      <thead>
                        <tr>
                          {['Tourist ID', 'Name', 'Nationality', 'Phone', 'Location', 'Status', 'Last Seen'].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tourists.map((t: any, i: number) => (
                          <tr key={t.id} style={{ background: i % 2 === 0 ? 'transparent' : '#FAFBFC' }}>
                            <td style={{ ...S.td, color: '#7C3AED', fontWeight: 600 }}>{t.touristId ?? t.id}</td>
                            <td style={{ ...S.td, fontWeight: 600, color: '#0F172A' }}>{t.user?.name ?? t.name ?? '—'}</td>
                            <td style={S.td}>{t.nationality ?? '—'}</td>
                            <td style={S.td}>{t.phone ?? t.user?.phone ?? '—'}</td>
                            <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 10 }}>
                              {t.currentLat ? `${t.currentLat.toFixed(3)}, ${t.currentLng?.toFixed(3)}` : '—'}
                            </td>
                            <td style={S.td}>
                              <span style={{
                                ...S.statusBadge,
                                background:  t.status === 'SOS'     ? '#FEF2F2' : t.status === 'OFFLINE' ? '#F8FAFC' : '#F0FDF4',
                                color:       t.status === 'SOS'     ? '#EF4444' : t.status === 'OFFLINE' ? '#94A3B8' : '#166534',
                                borderColor: t.status === 'SOS'     ? '#FECACA' : t.status === 'OFFLINE' ? '#E2E8F0' : '#BBF7D0',
                              }}>
                                <span style={{
                                  ...S.dot, width: 5, height: 5,
                                  background: t.status === 'SOS' ? '#EF4444' : t.status === 'OFFLINE' ? '#94A3B8' : '#10B981',
                                }} />
                                {t.status ?? 'UNKNOWN'}
                              </span>
                            </td>
                            <td style={{ ...S.td, color: '#94A3B8' }}>{timeAgo(t.lastSeen)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Alerts tab */}
              {activeTab === 'Alerts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                  {loadingData ? (
                    <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '20px 0', fontFamily: FONT }}>Loading alerts…</p>
                  ) : alerts.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#10B981', textAlign: 'center', padding: '20px 0', fontFamily: FONT }}>✅ No active alerts</p>
                  ) : alerts.map((a: any) => (
                    <div key={a.id} style={S.alertRow}>
                      <div style={{
                        ...S.alertIcon,
                        background: a.type === 'PANIC' ? '#FEE2E2' : a.type === 'GEOFENCE_EXIT' ? '#EDE9FE' : '#FEF3C7',
                      }}>
                        {a.type === 'PANIC' ? '🆘' : a.type === 'GEOFENCE_EXIT' ? '📍' : '⚠️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={S.alertTitle}>{a.title}</p>
                        <p style={S.alertDesc}>{a.description}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                          <span style={{
                            ...S.alertBadge,
                            color:       a.priority === 'HIGH' ? '#EF4444' : a.priority === 'MEDIUM' ? '#F59E0B' : '#94A3B8',
                            borderColor: a.priority === 'HIGH' ? '#FECACA' : a.priority === 'MEDIUM' ? '#FDE68A' : '#E2E8F0',
                          }}>{a.priority}</span>
                          <span style={{ ...S.alertBadge, color: '#10B981', borderColor: '#BBF7D0' }}>{a.status}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <p style={{ fontSize: 10, color: '#94A3B8', fontFamily: FONT }}>{timeAgo(a.createdAt)}</p>
                        <button onClick={() => resolveAlert(a.id)} style={S.resolveBtn}>Resolve</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Zones tab */}
              {activeTab === 'Zones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
                  {ZONES.map((z) => (
                    <div key={z.name} style={S.zoneCardLight}>
                      <div style={S.zoneTop}>
                        <p style={{ ...S.zoneName, color: '#0F172A' }}>{z.name}</p>
                        <p style={{ ...S.zonePct, color: z.color }}>{z.pct}%</p>
                      </div>
                      <div style={{ ...S.zoneBar, background: '#EEF2F7' }}>
                        <div style={{ ...S.zoneBarFill, width: `${z.pct}%`, background: z.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Broadcast tab */}
              {activeTab === 'Broadcast' && (
                <div style={{ padding: '12px 0' }}>
                  <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>
                    Send a broadcast message to all active tourists in Nanded
                  </p>
                  <textarea
                    style={S.broadcastArea}
                    placeholder="Type your broadcast message here..."
                    rows={4}
                    value={broadcast}
                    onChange={(e) => setBroadcast(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button style={S.broadcastBtn}>📢 Send to All Tourists</button>
                    <button style={{ ...S.broadcastBtn, background: '#F8FAFC', color: '#64748B', border: '0.5px solid #E2E8F0', boxShadow: 'none' }}>
                      🛡️ Nanded Zone Only
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div style={{ height: 16 }} />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}

// ─── THE ONLY CHANGE IN THIS FILE ─────────────────────────────────────────────
// BEFORE: allowedRoles={['AUTHORITY', 'ADMIN']}
// AFTER:  allowedRoles={['AUTHORITY', 'ADMIN']} stays same BUT admin now has
//         its own dashboard so admin won't land here anymore via login redirect.
//         TOUR_GUIDE was never in this list — they were hitting this page because
//         /dashboard/guide didn't exist. Now that it exists, they go there instead.
export default function AuthorityDashboardPage() {
  return (
    <AuthGuard allowedRoles={['AUTHORITY', 'ADMIN']}>
      <AuthorityDashboard />
    </AuthGuard>
  )
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */
const FONT = "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

const S: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', height: '100vh', background: '#F1F5F9',
    fontFamily: FONT, overflow: 'hidden', color: '#0F172A',
  },
  sidebar: {
    width: 224, background: '#0A1628', display: 'flex',
    flexDirection: 'column', flexShrink: 0,
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  sbBrand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '22px 16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  sbLogo: {
    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
    boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
  },
  sbName:  { fontSize: 13, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.3px', margin: 0, fontFamily: FONT },
  sbSub:   { fontSize: 10, color: '#475569', margin: 0, fontFamily: FONT },
  sbNav: {
    flex: 1, overflowY: 'auto', padding: '10px 8px',
    scrollbarWidth: 'none',
  },
  navLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#2D3F5A',
    padding: '14px 10px 6px', textTransform: 'uppercase', margin: 0, fontFamily: FONT,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '7px 10px', borderRadius: 9, marginBottom: 1,
    transition: 'background 0.15s', position: 'relative',
  },
  navIcon: {
    width: 28, height: 28, borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, flexShrink: 0, transition: 'background 0.15s',
  },
  navActiveDot: {
    marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%',
    background: 'rgba(255,255,255,0.5)', flexShrink: 0,
  },
  navBadge: {
    marginLeft: 'auto', fontSize: 9, fontWeight: 700,
    padding: '2px 6px', borderRadius: 99, background: '#EF4444', color: '#fff', fontFamily: FONT,
  },
  sbAuthBadge: {
    margin: '0 8px 8px', padding: '8px 12px', borderRadius: 9,
    background: 'rgba(168,85,247,0.1)', border: '0.5px solid rgba(168,85,247,0.25)',
    fontSize: 10, fontWeight: 600, color: '#A855F7',
    display: 'flex', alignItems: 'center', gap: 7, fontFamily: FONT,
  },
  sbAuthDot: {
    width: 6, height: 6, borderRadius: '50%', background: '#A855F7',
    display: 'inline-block', flexShrink: 0,
  },
  sbFooter: { padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  sbUser: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '9px 10px', borderRadius: 9,
    background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
  },
  sbAvatar: {
    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
  },
  sbUname: { fontSize: 11, fontWeight: 600, color: '#CBD5E1', margin: 0, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sbUrole: { fontSize: 9, color: '#475569', margin: 0, fontFamily: FONT },
  sbOnlineDot: {
    marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
    background: '#22C55E', flexShrink: 0, boxShadow: '0 0 0 2px rgba(34,197,94,0.2)',
  },
  main:   { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 22px', background: '#fff',
    borderBottom: '1px solid #E8EDF2', flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  tbTitle: { fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.4px', margin: 0, fontFamily: FONT },
  tbSub:   { fontSize: 11, color: '#64748B', margin: '2px 0 0', fontFamily: FONT },
  tbTime:  { fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: 'monospace' },
  tbRight: { display: 'flex', alignItems: 'center', gap: 8 },
  pill: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 10, fontWeight: 600, padding: '4px 11px', borderRadius: 99, fontFamily: FONT,
  },
  pillGreen:  { background: '#F0FDF4', color: '#166534', border: '0.5px solid #BBF7D0' },
  pillPurple: { background: '#FAF5FF', color: '#7C3AED', border: '0.5px solid #E9D5FF' },
  dot: { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' },
  content: {
    flex: 1, overflowY: 'auto', padding: '20px 22px', background: '#F1F5F9',
    display: 'flex', flexDirection: 'column', gap: 18,
    scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent',
  },
  secLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#94A3B8',
    textTransform: 'uppercase', margin: '0 0 11px', fontFamily: FONT,
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 },
  statCard: {
    borderRadius: 14, padding: '18px 16px', border: '1px solid #E8EDF2',
    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  scIcon:  { fontSize: 20, marginBottom: 10 },
  scLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px', fontFamily: FONT },
  scVal:   { fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1, margin: '4px 0 0', fontFamily: FONT },
  scSub:   { fontSize: 10, fontWeight: 600, margin: '8px 0 0', fontFamily: FONT },
  zoneGrid:     { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 },
  zoneCard:     { borderRadius: 12, padding: '12px 14px', border: '1px solid #E8EDF2', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  zoneCardLight:{ padding: '9px 0', borderBottom: '1px solid #F1F5F9' },
  zoneTop:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  zoneName:     { fontSize: 11, fontWeight: 600, color: '#334155', margin: 0, fontFamily: FONT },
  zonePct:      { fontSize: 12, fontWeight: 700, margin: 0, fontFamily: FONT },
  zoneBar:      { height: 5, borderRadius: 99, background: '#EEF2F7', overflow: 'hidden' },
  zoneBarFill:  { height: '100%', borderRadius: 99, transition: 'width 0.6s ease' },
  authCard: {
    borderRadius: 14, border: '1px solid #E8EDF2', background: '#fff',
    padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  authHeader: { marginBottom: 16 },
  authTitle:  { fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0, fontFamily: FONT },
  authSub:    { fontSize: 10, color: '#64748B', margin: '3px 0 0', fontFamily: FONT },
  tabRow: { display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  tab: {
    fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
    fontFamily: FONT,
  },
  tabBadge: {
    background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 9, fontWeight: 700,
    padding: '1px 6px', borderRadius: 99, marginLeft: 2, fontFamily: FONT,
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 11, fontFamily: FONT },
  th: {
    padding: '9px 12px', textAlign: 'left' as const, fontSize: 9, fontWeight: 700,
    letterSpacing: 1.5, textTransform: 'uppercase' as const, color: '#94A3B8',
    borderBottom: '1px solid #EEF2F7', fontFamily: FONT,
  },
  td: { padding: '11px 12px', color: '#64748B', borderBottom: '1px solid #F8FAFC', fontFamily: FONT },
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
    border: '0.5px solid', fontFamily: FONT,
  },
  alertRow: {
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 13px',
    background: '#FAFBFD', borderRadius: 10, border: '1px solid #EEF2F7',
  },
  alertIcon: {
    width: 34, height: 34, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, flexShrink: 0,
  },
  alertTitle: { fontSize: 12, fontWeight: 600, color: '#0F172A', margin: 0, fontFamily: FONT },
  alertDesc:  { fontSize: 10, color: '#64748B', margin: '2px 0 0', lineHeight: 1.55, fontFamily: FONT },
  alertBadge: {
    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
    border: '0.5px solid', background: 'transparent', fontFamily: FONT,
  },
  resolveBtn: {
    fontSize: 10, fontWeight: 600, padding: '4px 11px', borderRadius: 7,
    background: '#F0FDF4', color: '#166534', border: '0.5px solid #BBF7D0',
    cursor: 'pointer', fontFamily: FONT,
  },
  broadcastArea: {
    width: '100%', boxSizing: 'border-box' as const,
    background: '#F8FAFC', border: '1px solid #E8EDF2',
    color: '#374151', borderRadius: 9, padding: '10px 13px',
    fontSize: 12, resize: 'vertical' as const, fontFamily: FONT,
  },
  broadcastBtn: {
    fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 8,
    background: 'linear-gradient(90deg,#7C3AED,#6D28D9)', color: '#fff',
    border: 'none', cursor: 'pointer', fontFamily: FONT,
    boxShadow: '0 2px 8px rgba(124,58,237,0.2)',
  },
}