'use client'

import AuthGuard from '@/components/layout/AuthGuard'
import ToastContainer from '@/components/shared/Toast'
import { useLocation } from '@/hooks/useLocation'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getUser } from '@/lib/auth'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

/* ─────────────── nav config ─────────────── */
const NAV_MAIN = [
  { href: '/dashboard/tourist', icon: '🏠', label: 'Dashboard'     },
  { href: '/tracking',          icon: '📍', label: 'Live Tracking' },
  { href: '/emergency',         icon: '🆘', label: 'Emergency',    badge: '!' },
  { href: '/places',            icon: '🏛️', label: 'Nearby Places' },
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

/* ─────────────── stat cards ─────────────── */
const STATS = [
  { icon: '📍', label: 'Places Visited', labelColor: '#3B82F6', value: '12',   sub: '↑ 3 this week',    subColor: '#10B981' },
  { icon: '📅', label: 'Days on Trip',   labelColor: '#06B6D4', value: '7',    sub: '4 days remaining', subColor: '#0891B2' },
  { icon: '🛡️', label: 'Safety Status', labelColor: '#10B981', value: 'Safe', sub: 'Ping 2 min ago',   subColor: '#059669' },
  { icon: '🔔', label: 'Alerts Today',  labelColor: '#F59E0B', value: '0',    sub: 'All clear',         subColor: '#D97706' },
]

/* ─────────────── quick access ─────────────── */
const QUICK_LINKS = [
  { href: '/tour-picks',   icon: '🗺️', label: 'Tour Picks',   desc: 'Curated spots',  iconBg: '#DBEAFE' },
  { href: '/places',       icon: '🏛️', label: 'Places',       desc: 'Attractions',    iconBg: '#FEF3C7' },
  { href: '/emergency',    icon: '🆘', label: 'Emergency',    desc: 'SOS & contacts', iconBg: '#FFE4E6' },
  { href: '/tracking',     icon: '📍', label: 'My Location',  desc: 'Live position',  iconBg: '#D1FAE5' },
  { href: '/weather',      icon: '⛅',  label: 'Weather',      desc: 'Forecasts',      iconBg: '#CFFAFE' },
  { href: '/ai-assistant', icon: '🤖', label: 'AI Assistant', desc: 'Travel advice',  iconBg: '#EDE9FE' },
]

/* ─────────────── live weather — Nanded ─────────────── */
const WEATHER = {
  city:       'Nanded, Maharashtra',
  tempC:      33,
  condition:  'Sunny',
  feelsLike:  37,
  humidity:   '28%',
  wind:       '12 km/h',
  visibility: '10 km',
  aqi:        'Good',
  aqiColor:   '#059669',
  icon:       '☀️',
}

/* ─────────────── live nearby places ─────────────── */
const NEARBY = [
  { name: 'Hazur Sahib Gurudwara',    desc: '1.5 km · Sikh Pilgrimage',    time: '5 min'  },
  { name: 'Nandgiri Fort',            desc: '0.8 km · Historical Landmark', time: '3 min'  },
  { name: 'Guru Gobind Singh Museum', desc: '2.1 km · Heritage Museum',     time: '7 min'  },
  { name: 'Triangle Spot (Ghat)',     desc: '1.2 km · Godavari Viewpoint',  time: '4 min'  },
  { name: 'Guru Bramha Restaurant',   desc: '1.8 km · Pure Veg · 4.8★',    time: '6 min'  },
]

/* ─────────────── safety tips ─────────────── */
const TIPS = [
  { icon: '📋', bg: '#DBEAFE', text: 'Carry a printed passport copy when visiting government monuments.'          },
  { icon: '📞', bg: '#D1FAE5', text: 'Save 112 — the national emergency number, works on all networks.'          },
  { icon: '💧', bg: '#CFFAFE', text: 'Drink only bottled or filtered water, especially in rural areas.'          },
  { icon: '🌅', bg: '#FEF3C7', text: 'Visit Hazur Sahib at 5–7 AM for a peaceful, crowd-free experience.'        },
  { icon: '🎒', bg: '#FFE4E6', text: "Use a money belt and secure belongings in Nanded's busy markets."          },
  { icon: '🌡️', bg: '#FEF3C7', text: 'Heat is 97 °F+ this week — carry water and avoid peak afternoon sun.'     },
]

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = getUser()
  const initials = (user?.name ?? 'TU')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
            role="link"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && router.push(item.href)}
          >
            <span style={S.navIcon}>{item.icon}</span>
            <span style={{ ...S.navText, color: active ? '#fff' : '#94A3B8' }}>
              {item.label}
            </span>
            {item.badge && <span style={S.navBadge}>{item.badge}</span>}
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

      {/* nav groups */}
      <nav style={S.sbNav}>
        <NavGroup label="Main"    items={NAV_MAIN}    />
        <NavGroup label="Explore" items={NAV_EXPLORE} />
        <NavGroup label="Account" items={NAV_ACCOUNT} />
      </nav>

      {/* user footer */}
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
   DASHBOARD
════════════════════════════════════════ */
function TouristDashboard() {
  useLocation(true)
  useWebSocket(true)
  const user = getUser()

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>

        {/* ── topbar ── */}
        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>Tourist Dashboard</h1>
            <p style={S.tbSub}>
              Welcome back, {user?.name ?? 'Traveller'} ✈️ — Nanded, Maharashtra
            </p>
          </div>
          <div style={S.tbRight}>
            <span style={{ ...S.pill, ...S.pillGreen }}>
              <span style={{ ...S.dot, background: '#22C55E' }} /> Live Tracking
            </span>
            <span style={{ ...S.pill, ...S.pillBlue }}>
              <span style={{ ...S.dot, background: '#3B82F6' }} /> 7 Days Active
            </span>
          </div>
        </div>

        {/* ── scrollable content ── */}
        <main style={S.content}>

          {/* Hero */}
          <div style={S.hero}>
            <div style={S.heroAccent} />
            <div>
              <p style={S.heroTag}>Incredible India</p>
              <h2 style={S.heroH2}>
                Your journey <em style={S.heroEm}>starts here</em>
              </h2>
              <p style={S.heroP}>
                Stay safe, explore smart, and discover the very best of India with
                real-time safety tools and live tracking.
              </p>
              <div style={S.heroBtns}>
                <Link href="/tour-picks" style={S.btnPrimary}>🗺️ Explore Destinations</Link>
                <Link href="/emergency"  style={S.btnDanger}>🆘 Emergency</Link>
              </div>
            </div>
            <div style={S.heroFlag}>🇮🇳</div>
          </div>

          {/* Stats */}
          <section>
            <p style={S.secLabel}>Your trip at a glance</p>
            <div style={S.statsGrid}>
              {STATS.map((s) => (
                <div key={s.label} style={S.statCard}>
                  <div style={S.scIcon}>{s.icon}</div>
                  <p style={{ ...S.scLabel, color: s.labelColor }}>{s.label}</p>
                  <p style={{ ...S.scVal, fontSize: s.value.length > 4 ? 17 : 22 }}>
                    {s.value}
                  </p>
                  <p style={{ ...S.scSub, color: s.subColor }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick links */}
          <section>
            <p style={S.secLabel}>Quick access</p>
            <div style={S.linksGrid}>
              {QUICK_LINKS.map((q) => (
                <Link key={q.href} href={q.href} style={S.qlCard}>
                  <div style={{ ...S.qlIcon, background: q.iconBg }}>{q.icon}</div>
                  <p style={S.qlName}>{q.label}</p>
                  <p style={S.qlDesc}>{q.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Live widgets */}
          <section>
            <p style={S.secLabel}>Live updates</p>
            <div style={S.widgetsGrid}>

              {/* weather */}
              <div style={S.widgetCard}>
                <h3 style={S.widgetTitle}>⛅ Weather — Current Location</h3>
                <div style={S.locTag}>
                  <span style={S.locDot} /> {WEATHER.city}
                </div>
                <div style={S.weatherRow}>
                  <div>
                    <p style={S.weatherTemp}>{WEATHER.tempC}°C</p>
                    <p style={S.weatherInfo}>
                      {WEATHER.condition}<br />
                      Feels like {WEATHER.feelsLike}°C · High UV
                    </p>
                  </div>
                  <div style={{ fontSize: 40, opacity: 0.8 }}>{WEATHER.icon}</div>
                </div>
                <div style={S.weatherMeta}>
                  {[
                    { label: 'Humidity',   val: WEATHER.humidity,   color: '#0F172A' },
                    { label: 'Wind',       val: WEATHER.wind,       color: '#0F172A' },
                    { label: 'Visibility', val: WEATHER.visibility, color: '#0F172A' },
                    { label: 'AQI',        val: WEATHER.aqi,        color: WEATHER.aqiColor },
                  ].map((m) => (
                    <div key={m.label} style={S.wmBox}>
                      <p style={S.wmLabel}>{m.label}</p>
                      <p style={{ ...S.wmVal, color: m.color }}>{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* travel time */}
              <div style={S.widgetCard}>
                <h3 style={S.widgetTitle}>🚗 Travel Time — Nearby Attractions</h3>
                <div style={S.locTag}>
                  <span style={S.locDot} /> From your current location · Nanded
                </div>
                <div style={S.travelList}>
                  {NEARBY.map((p) => (
                    <div key={p.name} style={S.trItem}>
                      <div>
                        <p style={S.trDest}>{p.name}</p>
                        <p style={S.trDist}>{p.desc}</p>
                      </div>
                      <p style={S.trTime}>{p.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Safety tips */}
          <section>
            <p style={S.secLabel}>Travel safety tips</p>
            <div style={S.tipsGrid}>
              {TIPS.map((tip, i) => (
                <div key={i} style={S.tipCard}>
                  <div style={{ ...S.tipIcon, background: tip.bg }}>{tip.icon}</div>
                  <p style={S.tipText}>{tip.text}</p>
                </div>
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
const S: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    background: '#F8FAFC',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    overflow: 'hidden',
  },

  /* ── sidebar ── */
  sidebar: {
    width: 220,
    background: '#0F172A',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderRight: '0.5px solid #1E293B',
  },
  sbBrand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 16px 16px',
    borderBottom: '0.5px solid #1E293B',
  },
  sbLogo: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, flexShrink: 0,
  },
  sbName:  { fontSize: 13, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.2px', margin: 0 },
  sbSub:   { fontSize: 10, color: '#475569', margin: 0 },
  sbNav: {
    flex: 1, overflowY: 'auto', padding: '12px 8px',
    scrollbarWidth: 'thin', scrollbarColor: '#1E293B transparent',
  },
  navLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#334155',
    padding: '12px 8px 6px', textTransform: 'uppercase', margin: 0,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 8,
    marginBottom: 2, textDecoration: 'none', transition: 'background 0.15s',
  },
  navIcon: {
    width: 28, height: 28, borderRadius: 6, background: '#1E293B',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, flexShrink: 0,
  },
  navText:  { fontSize: 12, fontWeight: 500 },
  navBadge: {
    marginLeft: 'auto', fontSize: 9, fontWeight: 700,
    padding: '2px 6px', borderRadius: 99, background: '#EF4444', color: '#fff',
  },
  sbFooter: { padding: '12px 8px', borderTop: '0.5px solid #1E293B' },
  sbUser:   { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' },
  sbAvatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  sbUname: { fontSize: 11, fontWeight: 600, color: '#CBD5E1', margin: 0 },
  sbUrole: { fontSize: 9, color: '#475569', margin: 0 },

  /* ── main ── */
  main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar:  {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', background: '#fff', borderBottom: '0.5px solid #E2E8F0', flexShrink: 0,
  },
  tbTitle: { fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 },
  tbSub:   { fontSize: 11, color: '#64748B', marginTop: 1, margin: 0 },
  tbRight: { display: 'flex', alignItems: 'center', gap: 8 },
  pill: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
  },
  pillGreen: { background: '#F0FDF4', color: '#166534', border: '0.5px solid #BBF7D0' },
  pillBlue:  { background: '#EFF6FF', color: '#1D4ED8', border: '0.5px solid #BFDBFE' },
  dot:       { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' },

  /* ── content ── */
  content: {
    flex: 1, overflowY: 'auto', padding: '18px 20px', background: '#F8FAFC',
    display: 'flex', flexDirection: 'column', gap: 16,
    scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent',
  },

  /* ── hero ── */
  hero: {
    background: '#fff', borderRadius: 14, border: '0.5px solid #E2E8F0',
    padding: '20px 22px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: 'linear-gradient(90deg,#3B82F6,#06B6D4,#10B981)',
  },
  heroTag:  { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#2563EB', textTransform: 'uppercase', margin: 0 },
  heroH2:   { fontSize: 19, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1.25, margin: '6px 0 8px' },
  heroEm:   { fontStyle: 'italic', color: '#3B82F6', fontWeight: 300 },
  heroP:    { fontSize: 11, color: '#64748B', lineHeight: 1.6, maxWidth: 300, marginBottom: 14, margin: '0 0 14px' },
  heroFlag: { fontSize: 60, opacity: 0.08, lineHeight: 1, userSelect: 'none' },
  heroBtns: { display: 'flex', gap: 8 },
  btnPrimary: {
    fontSize: 11, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
    background: '#2563EB', color: '#fff', textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  btnDanger: {
    fontSize: 11, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
    background: '#FFF1F2', color: '#BE123C', border: '0.5px solid #FECDD3',
    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
  },

  /* ── section label ── */
  secLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#94A3B8',
    textTransform: 'uppercase', marginBottom: 10, margin: '0 0 10px',
  },

  /* ── stats ── */
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 },
  statCard:  { borderRadius: 12, padding: 14, border: '0.5px solid #E2E8F0', background: '#fff' },
  scIcon:    { fontSize: 16, marginBottom: 4 },
  scLabel:   { fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' },
  scVal:     { fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1, margin: '4px 0 0' },
  scSub:     { fontSize: 10, fontWeight: 600, margin: '4px 0 0' },

  /* ── quick links ── */
  linksGrid: { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 8 },
  qlCard: {
    borderRadius: 10, padding: '12px 10px', border: '0.5px solid #E2E8F0',
    background: '#fff', display: 'flex', flexDirection: 'column', gap: 6,
    cursor: 'pointer', textDecoration: 'none', transition: 'transform 0.15s',
  },
  qlIcon: { width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 },
  qlName: { fontSize: 11, fontWeight: 600, color: '#0F172A', margin: 0 },
  qlDesc: { fontSize: 9, color: '#94A3B8', margin: 0 },

  /* ── widgets ── */
  widgetsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 },
  widgetCard:  { borderRadius: 12, border: '0.5px solid #E2E8F0', background: '#fff', padding: '14px 16px' },
  widgetTitle: { fontSize: 11, fontWeight: 700, color: '#0F172A', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 },

  /* ── weather ── */
  locTag:      { display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#64748B', margin: '0 0 8px' },
  locDot:      { width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0 },
  weatherRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  weatherTemp: { fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', margin: 0 },
  weatherInfo: { fontSize: 10, color: '#64748B', lineHeight: 1.7, margin: 0 },
  weatherMeta: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 },
  wmBox:       { background: '#F8FAFC', borderRadius: 6, padding: '6px 8px' },
  wmLabel:     { fontSize: 9, color: '#94A3B8', margin: 0 },
  wmVal:       { fontSize: 12, fontWeight: 600, margin: 0 },

  /* ── travel time ── */
  travelList: { display: 'flex', flexDirection: 'column', gap: 6 },
  trItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '7px 10px', background: '#F8FAFC', borderRadius: 7,
  },
  trDest: { fontSize: 11, fontWeight: 600, color: '#0F172A', margin: 0 },
  trDist: { fontSize: 9, color: '#64748B', margin: 0 },
  trTime: { fontSize: 11, fontWeight: 700, color: '#3B82F6', margin: 0 },

  /* ── tips ── */
  tipsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 },
  tipCard: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 12px', background: '#fff',
    border: '0.5px solid #E2E8F0', borderRadius: 10,
  },
  tipIcon: { width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 },
  tipText: { fontSize: 11, color: '#475569', lineHeight: 1.6, margin: 0 },
}

/* ════════════════════════════════════════
   PAGE EXPORT
════════════════════════════════════════ */
export default function TouristDashboardPage() {
  return (
    <AuthGuard allowedRoles={['TOURIST']}>
      <TouristDashboard />
    </AuthGuard>
  )
}