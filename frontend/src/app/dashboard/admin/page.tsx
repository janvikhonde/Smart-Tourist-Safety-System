'use client'
import AuthGuard from '@/components/layout/AuthGuard'
import ToastContainer from '@/components/shared/Toast'
import { useLocation } from '@/hooks/useLocation'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getUser } from '@/lib/auth'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

/* ─────────────── nav config ─────────────── */
const NAV_MAIN = [
  { href: '/dashboard/admin',     icon: '🏠', label: 'Dashboard'       },
  { href: '/tracking',            icon: '📍', label: 'Live Tracking'   },
  { href: '/emergency',           icon: '🆘', label: 'Emergency', badge: '!' },
  { href: '/authority',           icon: '👮', label: 'Authority Panel' },
  { href: '/dashboard/authority', icon: '📊', label: 'Auth Dashboard'  },
]
const NAV_MANAGE = [
  { href: '/places',       icon: '🏛️', label: 'All Places'   },
  { href: '/tour-picks',   icon: '🗺️', label: 'Tour Picks'   },
  { href: '/weather',      icon: '⛅',  label: 'Weather'      },
  { href: '/ai-assistant', icon: '🤖', label: 'AI Assistant' },
]
const NAV_ACCOUNT = [
  { href: '/profile',  icon: '👤', label: 'My Profile' },
  { href: '/settings', icon: '⚙️', label: 'Settings'   },
]

/* ─────────────── stat cards ─────────────── */
const STATS = [
  { icon: '👥', label: 'Total Tourists', labelColor: '#6366F1', value: '8',  sub: '↑ 2 since yesterday', subColor: '#10B981' },
  { icon: '⚠️', label: 'Active Alerts',  labelColor: '#F59E0B', value: '3',  sub: '↑ 1 new this hour',   subColor: '#EF4444' },
  { icon: '🆘', label: 'In Emergency',   labelColor: '#EF4444', value: '0',  sub: 'No active SOS',        subColor: '#10B981' },
  { icon: '🛡️', label: 'Safe Zones',    labelColor: '#10B981', value: '6',  sub: 'All systems nominal',  subColor: '#059669' },
]

/* ─────────────── tourists ─────────────── */
const TOURISTS = [
  { id: 'TRS-7815', name: 'Janhavi',        nationality: 'Indian', phone: '1234567890', location: '—',              status: 'ACTIVE', checkedIn: '5m ago'  },
  { id: 'TRS-1125', name: 'Janhavi',        nationality: 'Indian', phone: '1234567890', location: '—',              status: 'ACTIVE', checkedIn: '12m ago' },
  { id: 'TRS-2118', name: 'Srushti Sharma', nationality: 'Indian', phone: '1234567890', location: '—',              status: 'ACTIVE', checkedIn: '18m ago' },
  { id: 'TRS-1226', name: 'Abhi Wakode',    nationality: 'Indian', phone: '7887797071', location: '19.112, 77.292', status: 'ACTIVE', checkedIn: '2m ago'  },
  { id: 'TRS-5742', name: 'Rupali Gaikwad', nationality: 'Indian', phone: '7654345678', location: '—',              status: 'ACTIVE', checkedIn: '34m ago' },
  { id: 'TRS-7919', name: 'Sakshi Verma',   nationality: 'Indian', phone: '6574832127', location: '—',              status: 'ACTIVE', checkedIn: '41m ago' },
  { id: 'TRS-2929', name: 'Janhavi Khonde', nationality: 'Indian', phone: '7689098765', location: '19.112, 77.295', status: 'ACTIVE', checkedIn: '1m ago'  },
  { id: 'TRS-9999', name: 'Janvi Khonde',   nationality: 'Indian', phone: '9529359715', location: '19.112, 77.295', status: 'ACTIVE', checkedIn: '8m ago'  },
]

/* ─────────────── alerts ─────────────── */
const ALERTS = [
  { icon: '🆘', iconBg: '#FEE2E2', title: 'SOS Panic — Hazur Sahib Exit',   desc: 'Tourist TRS-4821 triggered SOS alert near zone perimeter', level: 'HIGH',   status: 'ACTIVE',       time: '3m ago'  },
  { icon: '📍', iconBg: '#EDE9FE', title: 'Geo-fence Breach — Market Area', desc: 'Tourist TRS-3912 entered restricted zone boundary',          level: 'MEDIUM', status: 'ACTIVE',       time: '12m ago' },
  { icon: '⚠️', iconBg: '#FEF3C7', title: 'Crowd Spike — Nandgiri Fort',   desc: 'Density exceeded threshold by 42% — monitoring',             level: 'LOW',    status: 'ACKNOWLEDGED', time: '28m ago' },
  { icon: 'ℹ️', iconBg: '#DBEAFE', title: 'New Tourist Check-in',           desc: 'TRS-2256 registered at Hazur Sahib Gurudwara entry point',   level: 'LOW',    status: 'RESOLVED',     time: '52m ago' },
]

/* ─────────────── zones ─────────────── */
const ZONES = [
  { name: 'Hazur Sahib Gurudwara',    pct: 72, color: '#F59E0B' },
  { name: 'Nandgiri Fort',            pct: 58, color: '#10B981' },
  { name: 'Guru Gobind Singh Museum', pct: 34, color: '#10B981' },
  { name: 'Triangle Spot (Ghat)',     pct: 89, color: '#EF4444' },
  { name: 'Shri Khandoba Mandir',     pct: 45, color: '#10B981' },
  { name: 'Godavari Riverside',       pct: 61, color: '#10B981' },
]

/* ─────────────── activity ─────────────── */
const ACTIVITY = [
  { dot: '#10B981', text: 'TRS-1226 (Abhi Wakode) checked in at Hazur Sahib Gurudwara', time: '2 min ago'  },
  { dot: '#F59E0B', text: 'Zone alert: Triangle Spot reporting heavy crowd',              time: '14 min ago' },
  { dot: '#3B82F6', text: 'Broadcast sent to all tourists in Zone 3',                    time: '31 min ago' },
  { dot: '#10B981', text: 'TRS-9999 (Janvi Khonde) registered successfully',             time: '1 hr ago'   },
  { dot: '#F59E0B', text: 'Weather advisory issued for Nanded District',                 time: '2 hr ago'   },
]

const AUTH_TABS = ['Tourists', 'Alerts', 'Zones', 'Broadcast']

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = getUser()
  const initials = (user?.name ?? 'AD')
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
              background: active
                ? 'linear-gradient(90deg,#2563EB,#1D4ED8)'
                : 'transparent',
              cursor: 'pointer',
              boxShadow: active ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
            }}
            role="link"
            tabIndex={0}
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
              letterSpacing: '-0.1px',
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
      {/* brand */}
      <div style={S.sbBrand}>
        <div style={S.sbLogo}>🛡️</div>
        <div>
          <p style={S.sbName}>SafeTrail</p>
          <p style={S.sbSub}>Tourist Safety Platform</p>
        </div>
      </div>

      {/* nav */}
      <nav style={S.sbNav}>
        <NavGroup label="Main"    items={NAV_MAIN}    />
        <NavGroup label="Manage"  items={NAV_MANAGE}  />
        <NavGroup label="Account" items={NAV_ACCOUNT} />
      </nav>

      {/* admin badge */}
      <div style={S.sbAdminBadge}>
        <span style={S.sbAdminDot} />
        Admin Access — Full Privileges
      </div>

      {/* user footer */}
      <div style={S.sbFooter}>
        <div style={S.sbUser}>
          <div style={S.sbAvatar}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={S.sbUname}>{user?.name ?? 'Administrator'}</p>
            <p style={S.sbUrole}>Admin · Active</p>
          </div>
          <span style={S.sbOnlineDot} />
        </div>
      </div>
    </aside>
  )
}

/* ════════════════════════════════════════
   LIVE MAP
════════════════════════════════════════ */
function LiveMap() {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstance.current) return

    const loadLeaflet = async () => {
      if ((window as any).L) { initMap(); return }
      const link = document.createElement('link')
      link.rel   = 'stylesheet'
      link.href  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      const script   = document.createElement('script')
      script.src     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload  = initMap
      document.head.appendChild(script)
    }

    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return
      const L = (window as any).L
      const map = L.map(mapRef.current, { zoomControl: false }).setView([19.1383, 77.3210], 13)
      mapInstance.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const makeIcon = (color: string) => L.divIcon({
        html: `<div style="width:14px;height:14px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px ${color}88"></div>`,
        className: '', iconAnchor: [7, 7],
      })
      const makePulseIcon = (color: string, emoji: string) => L.divIcon({
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px">
          <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:${color}33;animation:pulse 1.5s infinite"></div>
          <div style="width:18px;height:18px;background:${color};border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;z-index:1">${emoji}</div>
        </div>`,
        className: '', iconAnchor: [14, 14],
      })

      const greenIcon = makeIcon('#10B981')
      const blueIcon  = makeIcon('#3B82F6')
      const warnIcon  = makeIcon('#F59E0B')
      const redIcon   = makePulseIcon('#EF4444', '🆘')

      L.marker([19.112, 77.292],  { icon: greenIcon }).addTo(map).bindPopup('<b>Abhi Wakode</b><br>TRS-1226 · Active')
      L.marker([19.112, 77.295],  { icon: greenIcon }).addTo(map).bindPopup('<b>Janhavi Khonde</b><br>TRS-2929 · Active')
      L.marker([19.112, 77.295],  { icon: blueIcon  }).addTo(map).bindPopup('<b>Janvi Khonde</b><br>TRS-9999 · Active')
      L.marker([19.1501, 77.3122],{ icon: warnIcon  }).addTo(map).bindPopup('<b>⚠️ Hazur Sahib Gurudwara</b><br>Zone: 72% · WARNING')
      L.marker([19.1432, 77.2968],{ icon: greenIcon }).addTo(map).bindPopup('<b>🏰 Nandgiri Fort</b><br>Zone: 58% · SAFE')
      L.marker([19.1550, 77.3280],{ icon: redIcon   }).addTo(map).bindPopup('<b>🆘 SOS — Triangle Spot</b><br>Crowd at 89% · DANGER')
      L.marker([19.1460, 77.3180],{ icon: greenIcon }).addTo(map).bindPopup('<b>🏛️ Guru Gobind Singh Museum</b><br>Zone: 34% · SAFE')
      L.marker([19.1350, 77.3050],{ icon: greenIcon }).addTo(map).bindPopup('<b>🕌 Shri Khandoba Mandir</b><br>Zone: 45% · SAFE')
      L.marker([19.1280, 77.3300],{ icon: greenIcon }).addTo(map).bindPopup('<b>🌊 Godavari Riverside</b><br>Zone: 61% · SAFE')

      const legend = L.control({ position: 'bottomleft' })
      legend.onAdd = () => {
        const div = L.DomUtil.create('div')
        div.style.cssText = 'background:rgba(255,255,255,0.96);padding:8px 12px;border-radius:8px;font-size:11px;color:#374151;display:flex;gap:14px;border:1px solid #E2E8F0;box-shadow:0 2px 8px rgba(0,0,0,0.08);font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif'
        div.innerHTML = `
          <span style="display:flex;align-items:center;gap:5px"><span style="width:9px;height:9px;background:#10B981;border-radius:50%;display:inline-block"></span>Safe</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:9px;height:9px;background:#F59E0B;border-radius:50%;display:inline-block"></span>Warning</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:9px;height:9px;background:#EF4444;border-radius:50%;display:inline-block"></span>Danger</span>`
        return div
      }
      legend.addTo(map)

      const liveBadge = L.control({ position: 'topleft' })
      liveBadge.onAdd = () => {
        const div = L.DomUtil.create('div')
        div.style.cssText = 'display:flex;flex-direction:column;gap:6px;font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif'
        div.innerHTML = `
          <div style="background:rgba(255,255,255,0.96);padding:5px 10px;border-radius:6px;font-size:10px;font-weight:700;color:#059669;border:1px solid #BBF7D0;display:flex;align-items:center;gap:5px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
            <span style="width:6px;height:6px;background:#10B981;border-radius:50%;display:inline-block"></span>LIVE
          </div>
          <div style="background:rgba(255,255,255,0.96);padding:5px 10px;border-radius:6px;font-size:10px;color:#64748B;border:1px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
            📍 Nanded, MH
          </div>`
        return div
      }
      liveBadge.addTo(map)
    }

    loadLeaflet()
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null } }
  }, [])

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 280, borderRadius: 12 }} />
}

/* ════════════════════════════════════════
   ADMIN DASHBOARD
════════════════════════════════════════ */
function AdminDashboard() {
  useLocation(true)
  useWebSocket(true)
  const [activeTab, setActiveTab] = useState('Tourists')
  const [time,      setTime]      = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>
        {/* ── topbar ── */}
        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>Admin Dashboard</h1>
            <p style={S.tbSub}>Full system control & oversight — Nanded, Maharashtra</p>
          </div>
          <div style={S.tbRight}>
            <span style={S.tbTime}>{time}</span>
            <span style={{ ...S.pill, ...S.pillRed }}>
              <span style={{ ...S.dot, background: '#F43F5E' }} /> Admin Access
            </span>
            <span style={{ ...S.pill, ...S.pillGreen }}>
              <span style={{ ...S.dot, background: '#22C55E' }} /> System Online
            </span>
          </div>
        </div>

        {/* ── content ── */}
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

          {/* Map + Activity */}
          <section>
            <p style={S.secLabel}>Live tourist map — Nanded</p>
            <div style={S.mapRow}>
              <div style={S.mapCard}><LiveMap /></div>
              <div style={S.activityCard}>
                <h3 style={S.widgetTitle}>📋 Recent Activity</h3>
                <div style={S.actList}>
                  {ACTIVITY.map((a, i) => (
                    <div key={i} style={S.actItem}>
                      <span style={{ ...S.actDot, background: a.dot }} />
                      <div>
                        <p style={S.actText}>{a.text}</p>
                        <p style={S.actTime}>{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                  <h3 style={S.authTitle}>👮 Authority Dashboard</h3>
                  <p style={S.authSub}>Tourist Registry · Alerts · Zone Control</p>
                </div>
                <Link href="/dashboard/authority" style={S.authLink}>
                  Open Full Panel →
                </Link>
              </div>

              {/* Tabs */}
              <div style={S.tabRow}>
                {AUTH_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      ...S.tab,
                      background: activeTab === t ? 'linear-gradient(90deg,#2563EB,#1D4ED8)' : 'transparent',
                      color:      activeTab === t ? '#fff' : '#64748B',
                      border:     activeTab === t ? 'none' : '0.5px solid #E2E8F0',
                      boxShadow:  activeTab === t ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
                    }}
                  >
                    {t === 'Tourists'  && '👥 '}
                    {t === 'Alerts'    && '🔔 '}
                    {t === 'Zones'     && '🛡️ '}
                    {t === 'Broadcast' && '📢 '}
                    {t}
                    {t === 'Tourists' && <span style={S.tabBadge}>{TOURISTS.length}</span>}
                    {t === 'Alerts'   && <span style={{ ...S.tabBadge, background: '#EF4444' }}>3</span>}
                    {t === 'Zones'    && <span style={{ ...S.tabBadge, background: '#10B981' }}>6</span>}
                  </button>
                ))}
              </div>

              {/* Tourist table */}
              {activeTab === 'Tourists' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Tourist ID', 'Name', 'Nationality', 'Phone', 'Location', 'Status', 'Checked In'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TOURISTS.map((t, i) => (
                        <tr key={t.id} style={{ background: i % 2 === 0 ? 'transparent' : '#FAFBFC' }}>
                          <td style={{ ...S.td, color: '#2563EB', fontWeight: 600 }}>{t.id}</td>
                          <td style={{ ...S.td, fontWeight: 600, color: '#0F172A' }}>{t.name}</td>
                          <td style={S.td}>{t.nationality}</td>
                          <td style={S.td}>{t.phone}</td>
                          <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 10 }}>{t.location}</td>
                          <td style={S.td}>
                            <span style={S.statusBadge}>
                              <span style={{ ...S.dot, background: '#10B981', width: 5, height: 5 }} />
                              {t.status}
                            </span>
                          </td>
                          <td style={{ ...S.td, color: '#94A3B8' }}>{t.checkedIn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Alerts tab */}
              {activeTab === 'Alerts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                  {ALERTS.map((a, i) => (
                    <div key={i} style={S.alertRow}>
                      <div style={{ ...S.alertIcon, background: a.iconBg }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <p style={S.alertTitle}>{a.title}</p>
                        <p style={S.alertDesc}>{a.desc}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                          <span style={{
                            ...S.alertBadge,
                            color:       a.level === 'HIGH' ? '#EF4444' : a.level === 'MEDIUM' ? '#F59E0B' : '#94A3B8',
                            borderColor: a.level === 'HIGH' ? '#FECACA' : a.level === 'MEDIUM' ? '#FDE68A' : '#E2E8F0',
                          }}>{a.level}</span>
                          <span style={{
                            ...S.alertBadge,
                            color:       a.status === 'ACTIVE' ? '#10B981' : a.status === 'ACKNOWLEDGED' ? '#F59E0B' : '#94A3B8',
                            borderColor: a.status === 'ACTIVE' ? '#BBF7D0' : '#E2E8F0',
                          }}>{a.status}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0 }}>{a.time}</p>
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
                      <div style={{ ...S.zoneBar, background: '#F1F5F9' }}>
                        <div style={{ ...S.zoneBarFill, width: `${z.pct}%`, background: z.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Broadcast tab */}
              {activeTab === 'Broadcast' && (
                <div style={{ padding: '12px 0' }}>
                  <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                    Send a broadcast message to all active tourists in Nanded
                  </p>
                  <textarea style={S.broadcastArea} placeholder="Type your broadcast message here..." rows={4} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button style={S.broadcastBtn}>📢 Send to All Tourists</button>
                    <button style={{ ...S.broadcastBtn, background: '#F8FAFC', color: '#64748B', border: '0.5px solid #E2E8F0' }}>
                      🛡️ Nanded Zone Only
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Quick actions */}
          <section>
            <p style={S.secLabel}>Quick actions</p>
            <div style={S.linksGrid}>
              {[
                { href: '/authority',           icon: '👮', label: 'Authority Panel', desc: 'Manage tourists',     iconBg: '#EDE9FE' },
                { href: '/dashboard/authority', icon: '📊', label: 'Auth Dashboard',  desc: 'Authority overview',  iconBg: '#E0F2FE' },
                { href: '/tracking',            icon: '📍', label: 'Live Tracking',   desc: 'Monitor locations',   iconBg: '#DBEAFE' },
                { href: '/tour-picks',          icon: '🗺️', label: 'Tour Picks',      desc: 'Manage destinations', iconBg: '#D1FAE5' },
                { href: '/emergency',           icon: '🆘', label: 'Emergency',       desc: 'SOS & contacts',      iconBg: '#FFE4E6' },
                { href: '/weather',             icon: '⛅',  label: 'Weather',         desc: 'Forecasts',           iconBg: '#CFFAFE' },
              ].map((q) => (
                <Link key={q.href} href={q.href} style={S.qlCard}>
                  <div style={{ ...S.qlIcon, background: q.iconBg }}>{q.icon}</div>
                  <p style={S.qlName}>{q.label}</p>
                  <p style={S.qlDesc}>{q.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          <div style={{ height: 16 }} />
        </main>
      </div>

      <ToastContainer />
    </div>
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

  /* ── sidebar ── */
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
    background: 'linear-gradient(135deg,#F43F5E,#7C3AED)',
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
    padding: '7px 10px', borderRadius: 9,
    marginBottom: 1, transition: 'background 0.15s',
    position: 'relative',
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
  sbAdminBadge: {
    margin: '0 8px 8px', padding: '8px 12px', borderRadius: 9,
    background: 'rgba(244,63,94,0.1)', border: '0.5px solid rgba(244,63,94,0.25)',
    fontSize: 10, fontWeight: 600, color: '#F43F5E',
    display: 'flex', alignItems: 'center', gap: 7, fontFamily: FONT,
  },
  sbAdminDot: {
    width: 6, height: 6, borderRadius: '50%', background: '#F43F5E',
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
    background: 'linear-gradient(135deg,#F43F5E,#7C3AED)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
  },
  sbUname: { fontSize: 11, fontWeight: 600, color: '#CBD5E1', margin: 0, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sbUrole: { fontSize: 9, color: '#475569', margin: 0, fontFamily: FONT },
  sbOnlineDot: {
    marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
    background: '#22C55E', flexShrink: 0, boxShadow: '0 0 0 2px rgba(34,197,94,0.2)',
  },

  /* ── main ── */
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
  pillGreen: { background: '#F0FDF4', color: '#166534', border: '0.5px solid #BBF7D0' },
  pillRed:   { background: '#FFF1F2', color: '#BE123C', border: '0.5px solid #FECDD3' },
  dot: { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' },

  /* ── content ── */
  content: {
    flex: 1, overflowY: 'auto', padding: '20px 22px', background: '#F1F5F9',
    display: 'flex', flexDirection: 'column', gap: 18,
    scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent',
  },
  secLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#94A3B8',
    textTransform: 'uppercase', margin: '0 0 11px', fontFamily: FONT,
  },

  /* ── stats ── */
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 },
  statCard: {
    borderRadius: 14, padding: '18px 16px', border: '1px solid #E8EDF2',
    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  scIcon:  { fontSize: 20, marginBottom: 10 },
  scLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px', fontFamily: FONT },
  scVal:   { fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1, margin: '4px 0 0', fontFamily: FONT },
  scSub:   { fontSize: 10, fontWeight: 600, margin: '8px 0 0', fontFamily: FONT },

  /* ── map row ── */
  mapRow:  { display: 'grid', gridTemplateColumns: '1fr 310px', gap: 12, height: 300 },
  mapCard: { borderRadius: 14, border: '1px solid #E8EDF2', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  activityCard: {
    borderRadius: 14, border: '1px solid #E8EDF2', background: '#fff',
    padding: '14px 16px', overflowY: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  widgetTitle: { fontSize: 11, fontWeight: 700, color: '#0F172A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT },
  actList: { display: 'flex', flexDirection: 'column', gap: 10 },
  actItem: { display: 'flex', alignItems: 'flex-start', gap: 9 },
  actDot:  { width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 3 },
  actText: { fontSize: 11, color: '#475569', lineHeight: 1.55, margin: 0, fontFamily: FONT },
  actTime: { fontSize: 9, color: '#94A3B8', margin: '3px 0 0', fontFamily: FONT },

  /* ── zones ── */
  zoneGrid:     { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 },
  zoneCard:     { borderRadius: 12, padding: '12px 14px', border: '1px solid #E8EDF2', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  zoneCardLight:{ padding: '9px 0', borderBottom: '1px solid #F1F5F9' },
  zoneTop:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  zoneName:     { fontSize: 11, fontWeight: 600, color: '#334155', margin: 0, fontFamily: FONT },
  zonePct:      { fontSize: 12, fontWeight: 700, margin: 0, fontFamily: FONT },
  zoneBar:      { height: 5, borderRadius: 99, background: '#EEF2F7', overflow: 'hidden' },
  zoneBarFill:  { height: '100%', borderRadius: 99, transition: 'width 0.6s ease' },

  /* ── authority card ── */
  authCard: {
    borderRadius: 14, border: '1px solid #E8EDF2', background: '#fff',
    padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  authHeader: { marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  authTitle:  { fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0, fontFamily: FONT },
  authSub:    { fontSize: 10, color: '#64748B', margin: '3px 0 0', fontFamily: FONT },
  authLink: {
    fontSize: 11, fontWeight: 600, color: '#2563EB', textDecoration: 'none',
    padding: '5px 12px', borderRadius: 7, background: '#EFF6FF',
    border: '0.5px solid #BFDBFE', fontFamily: FONT, flexShrink: 0,
  },

  /* ── tabs ── */
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

  /* ── table ── */
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 11, fontFamily: FONT },
  th: {
    padding: '9px 12px', textAlign: 'left' as const, fontSize: 9, fontWeight: 700,
    letterSpacing: 1.5, textTransform: 'uppercase' as const, color: '#94A3B8',
    borderBottom: '1px solid #EEF2F7', fontFamily: FONT,
  },
  td:          { padding: '11px 12px', color: '#64748B', borderBottom: '1px solid #F8FAFC', fontFamily: FONT },
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
    background: '#F0FDF4', color: '#166534', border: '0.5px solid #BBF7D0', fontFamily: FONT,
  },

  /* ── alerts ── */
  alertRow: {
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 13px',
    background: '#FAFBFD', borderRadius: 10, border: '1px solid #EEF2F7',
  },
  alertIcon:  { width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 },
  alertTitle: { fontSize: 12, fontWeight: 600, color: '#0F172A', margin: 0, fontFamily: FONT },
  alertDesc:  { fontSize: 10, color: '#64748B', margin: '2px 0 0', lineHeight: 1.55, fontFamily: FONT },
  alertBadge: { fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5, border: '0.5px solid', background: 'transparent', fontFamily: FONT },

  /* ── broadcast ── */
  broadcastArea: {
    width: '100%', boxSizing: 'border-box' as const,
    background: '#F8FAFC', border: '1px solid #E8EDF2',
    color: '#374151', borderRadius: 9, padding: '10px 13px',
    fontSize: 12, resize: 'vertical' as const, fontFamily: FONT,
  },
  broadcastBtn: {
    fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 8,
    background: 'linear-gradient(90deg,#2563EB,#1D4ED8)', color: '#fff',
    border: 'none', cursor: 'pointer', fontFamily: FONT,
    boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
  },

  /* ── quick links ── */
  linksGrid: { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10 },
  qlCard: {
    borderRadius: 12, padding: '13px 11px', border: '1px solid #E8EDF2',
    background: '#fff', display: 'flex', flexDirection: 'column', gap: 7,
    cursor: 'pointer', textDecoration: 'none', transition: 'transform 0.15s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  qlIcon: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
  qlName: { fontSize: 11, fontWeight: 600, color: '#0F172A', margin: 0, fontFamily: FONT },
  qlDesc: { fontSize: 9, color: '#94A3B8', margin: 0, fontFamily: FONT },
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminDashboard />
    </AuthGuard>
  )
}