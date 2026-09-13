'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getUser } from '@/lib/auth'

/* ─── Nav (same as dashboard sidebar) ─── */
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

/* ─── Nanded safety zones ─── */
const ZONES = [
  { name: 'Hazur Sahib Gurudwara', lat: 19.0720, lng: 77.3085, r: 500,  status: 'SAFE',    count: 312 },
  { name: 'Nandgiri Fort',         lat: 19.0851, lng: 77.2945, r: 400,  status: 'SAFE',    count: 118 },
  { name: 'Guru Gobind Singh Museum',lat:19.0740,lng: 77.3010, r: 300,  status: 'SAFE',    count: 76  },
  { name: 'Nanded Bus Stand Area', lat: 19.1600, lng: 77.3200, r: 600,  status: 'WARNING', count: 89  },
  { name: 'City Market / Bazaar',  lat: 19.1550, lng: 77.3100, r: 400,  status: 'DANGER',  count: 54  },
]

/* ─── Nanded nearby attractions (shown in side panel) ─── */
const NANDED_NEARBY = [
  { name: 'Hazur Sahib Gurudwara',    category: 'Sikh Pilgrimage',    dist: '1.5 km', time: '5 min',  status: 'SAFE',    icon: '🕌' },
  { name: 'Nandgiri Fort',            category: 'Historical Monument', dist: '0.8 km', time: '3 min',  status: 'SAFE',    icon: '🏯' },
  { name: 'Guru Gobind Singh Museum', category: 'Heritage Museum',     dist: '2.1 km', time: '7 min',  status: 'SAFE',    icon: '🏛️' },
  { name: 'Triangle Spot (Ghat)',     category: 'Godavari Viewpoint',  dist: '1.2 km', time: '4 min',  status: 'SAFE',    icon: '🌅' },
  { name: 'Guru Bramha Restaurant',   category: 'Pure Veg · 4.8★',    dist: '1.8 km', time: '6 min',  status: 'SAFE',    icon: '🍽️' },
  { name: 'Nanded Bus Stand',         category: 'Transport Hub',       dist: '3.2 km', time: '10 min', status: 'WARNING', icon: '🚌' },
  { name: 'Vishnu Puri Colony',       category: 'Residential Zone',    dist: '2.6 km', time: '8 min',  status: 'SAFE',    icon: '🏘️' },
  { name: 'City Market Bazaar',       category: 'Shopping Area',       dist: '4.1 km', time: '14 min', status: 'DANGER',  icon: '🛍️' },
]

const STATUS_COLOR: Record<string, string> = { SAFE: '#16a34a', WARNING: '#d97706', DANGER: '#dc2626' }
const STATUS_BG:    Record<string, string> = { SAFE: '#F0FDF4', WARNING: '#FEF3C7', DANGER: '#FFF1F2' }

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

/* ═══════════════════════════ MAP PLACEHOLDER ═══════════════════════════ */
// LeafletMap is dynamically imported to avoid SSR issues
let LeafletMap: React.ComponentType<{
  zones: typeof ZONES
  myLat?: number | null
  myLng?: number | null
}> | null = null

/* ═══════════════════════════ TRACKING CONTENT ═══════════════════════════ */
function TrackingContent() {
  const { safetyZones } = useStore()
  useWebSocket(true)

  const [myLat,    setMyLat]    = useState<number | null>(null)
  const [myLng,    setMyLng]    = useState<number | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'zones' | 'nearby'>('nearby')
  const [selectedZone, setSelectedZone] = useState<typeof ZONES[0] | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const MapRef  = useRef<typeof LeafletMap>(null)
  const watchIdRef = useRef<number | null>(null)

  /* GPS watch */
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported.'); return }

    navigator.geolocation.getCurrentPosition(
      pos => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); setGpsError(null) },
      err => setGpsError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); setGpsError(null) },
      err => { if (err.code !== 1) setGpsError(err.message) },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current) }
  }, [])

  /* Lazy load Leaflet */
  useEffect(() => {
    import('./LeafletMapComponent').then(mod => {
      MapRef.current = mod.default as any
      setMapReady(true)
    })
  }, [])

  const DynamicMap = MapRef.current

  const zones = safetyZones.length > 0
    ? safetyZones.map(z => ({ name: z.name, lat: z.centerLat, lng: z.centerLng, r: z.radiusMeters, status: z.status, count: z.touristCount }))
    : ZONES

  const totalTourists = zones.reduce((s, z) => s + z.count, 0)
  const safeCount     = zones.filter(z => z.status === 'SAFE').length
  const warnCount     = zones.filter(z => z.status === 'WARNING').length
  const dangerCount   = zones.filter(z => z.status === 'DANGER').length

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>

        {/* Topbar */}
        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>Live Tracking</h1>
            <p style={S.tbSub}>GPS · Geo-fence · Real-time Tourist Locations · Nanded, Maharashtra</p>
          </div>
          <div style={S.tbRight}>
            <span style={{ ...S.pill, ...S.pillRed }}>
              <span style={{ ...S.dot, background: '#EF4444', animation: 'pulse 1.5s infinite' }} /> LIVE
            </span>
            <span style={{ ...S.pill, ...S.pillGreen }}>
              <span style={{ ...S.dot, background: '#22C55E' }} /> {totalTourists} Tourists
            </span>
            <span style={{ ...S.pill, ...S.pillBlue }}>
              <span style={{ ...S.dot, background: '#3B82F6' }} /> {zones.length} Zones
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={S.body}>

          {/* Map */}
          <div style={S.mapWrap}>
            {mapReady && DynamicMap ? (
              <DynamicMap zones={zones as any} myLat={myLat} myLng={myLng} />
            ) : (
              <div style={S.mapLoading}>
                <div style={S.spinner} />
                <p style={{ color: '#64748B', fontSize: 13, fontWeight: 500 }}>Loading map…</p>
              </div>
            )}

            {/* Live badge */}
            <div style={S.liveBadge}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
              LIVE TRACKING
            </div>

            {/* GPS error */}
            {gpsError && (
              <div style={S.gpsBanner}>⚠️ GPS: {gpsError}</div>
            )}

            {/* Quick stats overlay */}
            <div style={S.statsOverlay}>
              {[
                { label: 'Safe',    value: safeCount,   color: '#16a34a', bg: '#F0FDF4' },
                { label: 'Warning', value: warnCount,   color: '#d97706', bg: '#FEF3C7' },
                { label: 'Danger',  value: dangerCount, color: '#dc2626', bg: '#FFF1F2' },
              ].map(s => (
                <div key={s.label} style={{ ...S.statPill, background: s.bg, color: s.color, border: `0.5px solid ${s.color}40` }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                  {s.value} {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div style={S.panel}>

            {/* Panel header */}
            <div style={S.panelHead}>
              <h3 style={S.panelTitle}>Zone Monitor</h3>
              <p style={S.panelSub}>{zones.length} zones · {totalTourists} tourists</p>
            </div>

            {/* Tabs */}
            <div style={S.tabs}>
              {(['nearby', 'zones'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}>
                  {tab === 'nearby' ? '📍 Nearby Places' : '🛡️ Safety Zones'}
                </button>
              ))}
            </div>

            {/* Tab: Nearby Places (Nanded) */}
            {activeTab === 'nearby' && (
              <div style={S.list}>
                <div style={S.listHead}>
                  <span style={S.locDot} />
                  <span style={{ fontSize: 10, color: '#64748B' }}>Based on your live location · Nanded</span>
                </div>
                {NANDED_NEARBY.map((place, i) => (
                  <div key={i} style={S.placeItem}>
                    <div style={{ ...S.placeIconWrap, background: STATUS_BG[place.status] }}>
                      <span style={{ fontSize: 14 }}>{place.icon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={S.placeName}>{place.name}</p>
                      <p style={S.placeCategory}>{place.category}</p>
                      <div style={S.placeMeta}>
                        <span style={S.placeMetaItem}>📏 {place.dist}</span>
                        <span style={S.placeMetaItem}>🕐 {place.time}</span>
                      </div>
                    </div>
                    <span style={{ ...S.statusBadge, background: STATUS_BG[place.status], color: STATUS_COLOR[place.status] }}>
                      {place.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Safety Zones */}
            {activeTab === 'zones' && (
              <div style={S.list}>
                {zones.map((z, i) => {
                  const isSelected = selectedZone?.name === z.name
                  return (
                    <button key={i} onClick={() => setSelectedZone(isSelected ? null : z as any)}
                      style={{ ...S.zoneItem, background: isSelected ? '#F8FAFC' : '#fff' }}>
                      <div style={{ ...S.zoneIconWrap, background: STATUS_BG[z.status] }}>
                        <span style={{ fontSize: 14 }}>
                          {z.status === 'SAFE' ? '✅' : z.status === 'WARNING' ? '⚠️' : '🚨'}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <p style={S.zoneName}>{z.name}</p>
                        <p style={S.zoneCount}>👥 {z.count} tourists</p>
                        {isSelected && (
                          <div style={S.zoneDetail}>
                            <p style={S.zoneDetailText}>📍 {z.lat.toFixed(4)}, {z.lng.toFixed(4)}</p>
                            <p style={S.zoneDetailText}>⭕ Radius: {z.r}m</p>
                          </div>
                        )}
                      </div>
                      <span style={{ ...S.statusBadge, background: STATUS_BG[z.status], color: STATUS_COLOR[z.status] }}>
                        {z.status}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* My GPS */}
            <div style={S.gpsBox}>
              <div style={S.gpsInner}>
                <p style={S.gpsLabel}>📡 My GPS Location · Nanded</p>
                {myLat && myLng ? (
                  <>
                    <p style={S.gpsCord}>{myLat.toFixed(5)}</p>
                    <p style={S.gpsCord}>{myLng.toFixed(5)}</p>
                    <div style={S.gpsStatus}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                      <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Tracking Active</span>
                    </div>
                  </>
                ) : gpsError ? (
                  <p style={{ fontSize: 11, color: '#ef4444' }}>{gpsError}</p>
                ) : (
                  <div style={S.gpsStatus}>
                    <div style={S.miniSpinner} />
                    <span style={{ fontSize: 10, color: '#64748B' }}>Acquiring GPS…</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
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

  /* Sidebar — identical to dashboard */
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

  /* Main layout */
  main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderBottom: '0.5px solid #E2E8F0', flexShrink: 0 },
  tbTitle: { fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 },
  tbSub:   { fontSize: 11, color: '#64748B', margin: 0 },
  tbRight: { display: 'flex', alignItems: 'center', gap: 8 },
  pill:    { display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99 },
  pillRed:   { background: '#FFF1F2', color: '#BE123C', border: '0.5px solid #FECDD3' },
  pillGreen: { background: '#F0FDF4', color: '#166534', border: '0.5px solid #BBF7D0' },
  pillBlue:  { background: '#EFF6FF', color: '#1D4ED8', border: '0.5px solid #BFDBFE' },
  dot:     { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' },

  body:    { flex: 1, display: 'flex', overflow: 'hidden' },

  /* Map */
  mapWrap:   { flex: 1, position: 'relative', background: '#E8EDF2' },
  mapLoading:{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#F0F4F8' },
  spinner:   { width: 28, height: 28, borderRadius: '50%', border: '2px solid #BFDBFE', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite' },
  liveBadge: {
    position: 'absolute', top: 14, left: 14,
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 99, zIndex: 999,
    background: '#fff', border: '0.5px solid #FECDD3', color: '#DC2626',
    fontSize: 10, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  gpsBanner:  {
    position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
    padding: '8px 16px', borderRadius: 10, zIndex: 999,
    background: '#FFF1F2', border: '0.5px solid #FECDD3', color: '#B91C1C',
    fontSize: 11, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  statsOverlay: { position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6, zIndex: 999 },
  statPill:     { display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },

  /* Side panel */
  panel:     { width: 280, display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: '0.5px solid #E2E8F0', flexShrink: 0 },
  panelHead: { padding: '14px 16px', borderBottom: '0.5px solid #F1F5F9' },
  panelTitle:{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 },
  panelSub:  { fontSize: 10, color: '#94A3B8', margin: '2px 0 0' },

  /* Tabs */
  tabs:     { display: 'flex', borderBottom: '0.5px solid #F1F5F9' },
  tab:      { flex: 1, padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '2px solid transparent' },
  tabActive:{ color: '#2563EB', borderBottomColor: '#2563EB' },

  /* Nearby list */
  list:     { flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#E2E8F0 transparent' },
  listHead: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#F8FAFC', borderBottom: '0.5px solid #F1F5F9' },
  locDot:   { width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0 },

  placeItem:     { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderBottom: '0.5px solid #F8FAFC', cursor: 'default' },
  placeIconWrap: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  placeName:     { fontSize: 11, fontWeight: 600, color: '#0F172A', margin: 0 },
  placeCategory: { fontSize: 9, color: '#94A3B8', margin: '1px 0 0' },
  placeMeta:     { display: 'flex', gap: 8, marginTop: 3 },
  placeMetaItem: { fontSize: 9, color: '#64748B' },
  statusBadge:   { fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 },

  zoneItem:     { width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderBottom: '0.5px solid #F8FAFC', cursor: 'pointer', border: 'none' },
  zoneIconWrap: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  zoneName:     { fontSize: 11, fontWeight: 600, color: '#0F172A', margin: 0 },
  zoneCount:    { fontSize: 9, color: '#94A3B8', margin: '2px 0 0' },
  zoneDetail:   { marginTop: 6, paddingTop: 6, borderTop: '0.5px solid #F1F5F9' },
  zoneDetailText:{ fontSize: 9, color: '#64748B', margin: '2px 0 0' },

  /* GPS box */
  gpsBox:   { padding: 12, borderTop: '0.5px solid #F1F5F9' },
  gpsInner: { borderRadius: 10, padding: 12, background: '#F8FAFC', border: '0.5px solid #E2E8F0' },
  gpsLabel: { fontSize: 9, color: '#94A3B8', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 },
  gpsCord:  { fontSize: 11, color: '#0F172A', fontFamily: 'monospace', margin: '1px 0' },
  gpsStatus:{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 },
  miniSpinner:{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #BFDBFE', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite' },
}

export default function TrackingPage() {
  return <AuthGuard><TrackingContent /></AuthGuard>
}