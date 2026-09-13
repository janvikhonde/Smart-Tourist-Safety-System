'use client'
import AuthGuard from '@/components/layout/AuthGuard'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWeather } from '@/hooks/useWeather'
import { useStore } from '@/store/useStore'
import { getUser } from '@/lib/auth'

/* ─── Nav (matches dashboard) ─── */
const NAV_MAIN    = [
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

/* ─── Nanded 7-day forecast ─── */
const NANDED_FORECAST = [
  { dayName: 'Monday',    tempMax: 36, tempMin: 24, description: 'Partly Cloudy', icon: '⛅', rainChance: 10 },
  { dayName: 'Tuesday',   tempMax: 38, tempMin: 26, description: 'Sunny',         icon: '☀️', rainChance: 5  },
  { dayName: 'Wednesday', tempMax: 31, tempMin: 23, description: 'Thunderstorm',  icon: '⛈️', rainChance: 80 },
  { dayName: 'Thursday',  tempMax: 29, tempMin: 22, description: 'Light Rain',    icon: '🌧️', rainChance: 65 },
  { dayName: 'Friday',    tempMax: 33, tempMin: 24, description: 'Mostly Sunny',  icon: '🌤️', rainChance: 20 },
  { dayName: 'Saturday',  tempMax: 35, tempMin: 25, description: 'Clear',         icon: '☀️', rainChance: 5  },
  { dayName: 'Sunday',    tempMax: 34, tempMin: 23, description: 'Partly Cloudy', icon: '⛅', rainChance: 15 },
]

/* ─── Hourly today ─── */
const HOURLY = [
  { hour: '6 AM',  temp: 28, icon: '🌤️' },
  { hour: '9 AM',  temp: 31, icon: '☀️'  },
  { hour: '12 PM', temp: 35, icon: '☀️'  },
  { hour: '3 PM',  temp: 37, icon: '☀️'  },
  { hour: '6 PM',  temp: 33, icon: '🌤️' },
  { hour: '9 PM',  temp: 29, icon: '🌙'  },
]

/* ─── Advisories ─── */
const ADVISORIES = [
  { icon: '🌡️', title: 'Heat Advisory',    desc: 'Temp above 36 °C expected. Carry water & stay hydrated.',    color: '#F59E0B', bg: '#FEF3C7' },
  { icon: '🌩️', title: 'Storm Watch Wed',  desc: 'Thunderstorms expected mid-week. Avoid outdoor activities.',  color: '#EF4444', bg: '#FFF1F2' },
  { icon: '🧴',  title: 'UV Index High',    desc: 'UV Index 8+ (Very High). Apply SPF 50+ sunscreen.',           color: '#8B5CF6', bg: '#EDE9FE' },
]

/* ═══════════════════════════ SIDEBAR ═══════════════════════════ */
function Sidebar() {
  const pathname = usePathname()
  const user     = getUser()
  const initials = (user?.name ?? 'TU').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()

  type NavItem = { href: string; icon: string; label: string; badge?: string }
  const NavGroup = ({ label, items }: { label: string; items: NavItem[] }) => (
    <>
      <p style={S.navLabel}>{label}</p>
      {items.map(item => {
        const active = pathname === item.href
        return (
          <Link key={item.href} href={item.href}
            style={{ ...S.navItem, background: active ? '#1D4ED8' : 'transparent' }}>
            <span style={S.navIcon}>{item.icon}</span>
            <span style={{ ...S.navText, color: active ? '#fff' : '#94A3B8' }}>{item.label}</span>
            {item.badge && <span style={S.navBadge}>{item.badge}</span>}
          </Link>
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

/* ═══════════════════════════ WEATHER CONTENT ═══════════════════════════ */
function WeatherContent() {
  const { weather } = useWeather()
  const forecast = weather?.forecast ?? NANDED_FORECAST

  const currentTemp  = weather?.temp        ?? 33
  const currentIcon  = weather?.icon        ?? '☀️'
  const currentDesc  = weather?.description ?? 'Sunny'
  const feelsLike    = weather?.feelsLike   ?? 37
  const humidity     = weather?.humidity    ?? 28
  const windSpeed    = weather?.windSpeed   ?? 12
  const visibility   = weather?.visibility ?? 10

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>

        {/* Topbar */}
        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>Weather Forecast</h1>
            <p style={S.tbSub}>7-day outlook · Safety Advisories · Nanded, Maharashtra</p>
          </div>
          <div style={S.tbRight}>
            <span style={{ ...S.pill, ...S.pillBlue }}>
              <span style={{ ...S.dot, background: '#3B82F6' }} /> Live Weather
            </span>
            <span style={{ ...S.pill, ...S.pillAmber }}>
              <span style={{ ...S.dot, background: '#F59E0B' }} /> UV Index: High
            </span>
          </div>
        </div>

        <main style={S.content}>

          {/* Current weather hero */}
          <div style={S.heroCard}>
            <div style={S.heroAccent} />
            <div style={S.heroBody}>
              <div>
                <div style={S.locRow}>
                  <span style={S.locDot} />
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Nanded, Maharashtra · Live</span>
                </div>
                <div style={S.tempRow}>
                  <p style={S.tempBig}>{currentTemp}°C</p>
                  <span style={{ fontSize: 48, lineHeight: 1 }}>{currentIcon}</span>
                </div>
                <p style={S.tempDesc}>{currentDesc} · Feels like {feelsLike}°C · High UV</p>
              </div>
              <div style={S.metaGrid}>
                {[
                  { label: 'Humidity',   val: `${humidity}%`,      icon: '💧' },
                  { label: 'Wind',       val: `${windSpeed} km/h`, icon: '💨' },
                  { label: 'Visibility', val: `${visibility} km`,  icon: '👁️' },
                  { label: 'AQI',        val: 'Good',              icon: '🌿' },
                ].map(m => (
                  <div key={m.label} style={S.metaBox}>
                    <p style={S.metaLabel}>{m.icon} {m.label}</p>
                    <p style={S.metaVal}>{m.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hourly */}
          <section>
            <p style={S.secLabel}>Today's hourly — Nanded</p>
            <div style={S.hourlyRow}>
              {HOURLY.map((h, i) => (
                <div key={i} style={S.hourCard}>
                  <p style={S.hourTime}>{h.hour}</p>
                  <span style={{ fontSize: 20 }}>{h.icon}</span>
                  <p style={S.hourTemp}>{h.temp}°</p>
                </div>
              ))}
            </div>
          </section>

          {/* 7-day forecast */}
          <section>
            <p style={S.secLabel}>7-day forecast</p>
            <div style={S.forecastGrid}>
              {forecast.map((d: any, i: number) => (
                <div key={i} style={S.forecastCard}>
                  <p style={S.fDay}>{d.dayName.slice(0,3)}</p>
                  <span style={{ fontSize: 22, lineHeight: 1.3 }}>{d.icon}</span>
                  <div>
                    <p style={S.fMax}>{d.tempMax}°</p>
                    <p style={S.fMin}>{d.tempMin}°</p>
                  </div>
                  <div style={{ ...S.rainBadge, color: d.rainChance > 50 ? '#0891B2' : '#94A3B8', background: d.rainChance > 50 ? '#CFFAFE' : '#F8FAFC' }}>
                    💧 {d.rainChance}%
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* UV Index bar */}
          <section>
            <p style={S.secLabel}>UV Index</p>
            <div style={S.uvCard}>
              <div style={S.uvRow}>
                <div style={S.uvBarWrap}>
                  <div style={S.uvBarTrack}>
                    <div style={S.uvBarFill} />
                    <div style={S.uvMarker} />
                  </div>
                </div>
                <span style={S.uvVal}>8 — Very High</span>
              </div>
              <div style={S.uvScale}>
                <span>Low (0–2)</span>
                <span>Moderate (3–5)</span>
                <span>High (6–7)</span>
                <span>Very High (8–10)</span>
              </div>
            </div>
          </section>

          {/* Advisories */}
          <section>
            <p style={S.secLabel}>Safety advisories</p>
            <div style={S.advisoriesGrid}>
              {ADVISORIES.map((a, i) => (
                <div key={i} style={{ ...S.advisoryCard, border: `0.5px solid ${a.color}30`, background: a.bg }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <p style={{ ...S.advTitle, color: a.color }}>{a.title}</p>
                    <p style={S.advDesc}>{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: 16 }} />
        </main>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   STYLES — Light theme matching dashboard
════════════════════════════════════════ */
const S: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', height: '100vh', background: '#F8FAFC', overflow: 'hidden',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Geist', 'Inter', sans-serif",
  },

  /* Sidebar */
  sidebar: { width: 220, background: '#0F172A', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '0.5px solid #1E293B' },
  sbBrand: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 16px', borderBottom: '0.5px solid #1E293B' },
  sbLogo:  { width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3B82F6,#06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 },
  sbName:  { fontSize: 13, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.2px', margin: 0 },
  sbSub:   { fontSize: 10, color: '#475569', margin: 0 },
  sbNav:   { flex: 1, overflowY: 'auto', padding: '12px 8px', scrollbarWidth: 'thin', scrollbarColor: '#1E293B transparent' },
  navLabel:{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#334155', padding: '12px 8px 6px', textTransform: 'uppercase', margin: 0 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, textDecoration: 'none' },
  navIcon: { width: 28, height: 28, borderRadius: 6, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 },
  navText: { fontSize: 12, fontWeight: 500 },
  navBadge:{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#EF4444', color: '#fff' },
  sbFooter:{ padding: '12px 8px', borderTop: '0.5px solid #1E293B' },
  sbUser:  { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' },
  sbAvatar:{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 },
  sbUname: { fontSize: 11, fontWeight: 600, color: '#CBD5E1', margin: 0 },
  sbUrole: { fontSize: 9, color: '#475569', margin: 0 },

  /* Main */
  main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderBottom: '0.5px solid #E2E8F0', flexShrink: 0 },
  tbTitle: { fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 },
  tbSub:   { fontSize: 11, color: '#64748B', margin: 0 },
  tbRight: { display: 'flex', alignItems: 'center', gap: 8 },
  pill:    { display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99 },
  pillBlue:  { background: '#EFF6FF', color: '#1D4ED8', border: '0.5px solid #BFDBFE' },
  pillAmber: { background: '#FFFBEB', color: '#92400E', border: '0.5px solid #FDE68A' },
  dot:     { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' },

  content: { flex: 1, overflowY: 'auto', padding: '18px 20px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 16, scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' },

  /* Hero card */
  heroCard: { background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '24px', position: 'relative', overflow: 'hidden' },
  heroAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#3B82F6,#06B6D4,#10B981)' },
  heroBody: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' },
  locRow:   { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  locDot:   { width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0 },
  tempRow:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 },
  tempBig:  { fontSize: 52, fontWeight: 800, color: '#0F172A', letterSpacing: '-2px', lineHeight: 1, margin: 0 },
  tempDesc: { fontSize: 12, color: '#64748B', margin: 0 },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  metaBox:  { background: '#F8FAFC', borderRadius: 8, padding: '8px 12px', border: '0.5px solid #E2E8F0' },
  metaLabel:{ fontSize: 9, color: '#94A3B8', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 },
  metaVal:  { fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 },

  /* Hourly */
  hourlyRow: { display: 'flex', gap: 8 },
  hourCard:  { flex: 1, background: '#fff', borderRadius: 10, border: '0.5px solid #E2E8F0', padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  hourTime:  { fontSize: 9, color: '#94A3B8', fontWeight: 600, margin: 0, textTransform: 'uppercase' },
  hourTemp:  { fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 },

  /* Section label */
  secLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 10px' },

  /* Forecast */
  forecastGrid: { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 8 },
  forecastCard: { background: '#fff', borderRadius: 10, border: '0.5px solid #E2E8F0', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
  fDay:  { fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 },
  fMax:  { fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, textAlign: 'center' },
  fMin:  { fontSize: 10, color: '#94A3B8', margin: 0, textAlign: 'center' },
  rainBadge: { fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 99 },

  /* UV bar */
  uvCard:    { background: '#fff', borderRadius: 12, border: '0.5px solid #E2E8F0', padding: '14px 16px' },
  uvRow:     { display: 'flex', alignItems: 'center', gap: 12 },
  uvBarWrap: { flex: 1 },
  uvBarTrack:{ height: 10, borderRadius: 99, overflow: 'visible', position: 'relative', background: 'linear-gradient(to right, #34D399, #FCD34D, #F87171)' },
  uvBarFill: { position: 'absolute', inset: 0, borderRadius: 99 },
  uvMarker:  { position: 'absolute', top: -3, left: '78%', width: 16, height: 16, borderRadius: '50%', background: '#fff', border: '2.5px solid #F59E0B', boxShadow: '0 2px 6px rgba(245,158,11,0.4)' },
  uvVal:     { fontSize: 12, fontWeight: 700, color: '#B45309', flexShrink: 0 },
  uvScale:   { display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: '#94A3B8' },

  /* Advisories */
  advisoriesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 },
  advisoryCard:   { borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' },
  advTitle: { fontSize: 12, fontWeight: 700, margin: '0 0 4px' },
  advDesc:  { fontSize: 11, color: '#475569', lineHeight: 1.5, margin: 0 },
}

export default function WeatherPage() {
  return <AuthGuard><WeatherContent /></AuthGuard>
}