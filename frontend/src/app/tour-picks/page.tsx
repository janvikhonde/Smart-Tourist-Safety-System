'use client'
import { useEffect, useState } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import { usePathname, useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import {
  tourGuidePlacesStore,
  TourGuidePlace,
  CAT_COLOR,
  SEASON_COLOR,
  DIFF_COLOR,
  SEASON_MONTHS,
} from '@/lib/tourGuideStore'

// ── Nav config (matches dashboard sidebar) ────────────────────────────────────
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

/* ════════════════════════════════════════
   SIDEBAR (matches dashboard exactly)
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

function TourPicksContent() {
  const [guidePlaces,  setGuidePlaces]  = useState<TourGuidePlace[]>([])
  const [selected,     setSelected]     = useState<TourGuidePlace | null>(null)
  const [guideFilter,  setGuideFilter]  = useState('All')
  const [guideSearch,  setGuideSearch]  = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    tourGuidePlacesStore.init()
    setGuidePlaces(tourGuidePlacesStore.getActivePlaces())
    const unsub = tourGuidePlacesStore.subscribe(all =>
      setGuidePlaces(all.filter(p => p.status === 'Active'))
    )
    return unsub
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const allCategories = ['All', ...Array.from(new Set(guidePlaces.map(p => p.category)))]

  const filtered = guidePlaces.filter(p =>
    (guideFilter === 'All' || p.category === guideFilter) &&
    (
      p.name.toLowerCase().includes(guideSearch.toLowerCase()) ||
      p.location.toLowerCase().includes(guideSearch.toLowerCase())
    )
  )

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>
        {/* ── TopBar ── */}
        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>Tour Guide Picks</h1>
            <p style={S.tbSub}>Famous destinations across India — curated by our expert guides</p>
          </div>
          <div style={S.tbRight}>
            <span style={{ ...S.pill, ...S.pillAmber }}>
              <span style={{ fontSize: 12 }}>🇮🇳</span> Incredible India
            </span>
            <span style={{ ...S.pill, ...S.pillBlue }}>
              {filtered.length} destinations
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left Panel ───────────────────────────────────────────── */}
          <div style={{
            ...S.leftPanel,
            width: selected ? '320px' : '100%',
          }}>

            {/* Search + filters */}
            <div style={S.filterBar}>
              <input
                value={guideSearch}
                onChange={e => setGuideSearch(e.target.value)}
                placeholder="🔍 Search destinations, cities…"
                style={S.searchInput}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {allCategories.map(cat => {
                  const color = CAT_COLOR[cat] || '#3B82F6'
                  const active = guideFilter === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setGuideFilter(cat)}
                      style={{
                        padding: '5px 12px', borderRadius: 8, border: 'none',
                        cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        background: active ? color : '#F1F5F9',
                        color:      active ? '#fff' : '#64748B',
                        transition: 'all 0.15s',
                      }}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
              <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 8, marginBottom: 0 }}>
                {filtered.length} destination{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Card list */}
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}>
              {filtered.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
                  <span style={{ fontSize: 32, opacity: 0.2 }}>🇮🇳</span>
                  <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '0 24px', margin: 0 }}>
                    No destinations found.
                  </p>
                </div>
              ) : selected ? (
                // Compact list when detail open
                filtered.map(place => {
                  const isActive = selected?.id === place.id
                  const catColor = CAT_COLOR[place.category] || '#3B82F6'
                  return (
                    <div
                      key={place.id}
                      onClick={() => setSelected(isActive ? null : place)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '0.5px solid #F1F5F9',
                        background: isActive ? `${catColor}08` : '#fff',
                        borderLeft: isActive ? `3px solid ${catColor}` : '3px solid transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <img
                        src={place.image} alt=""
                        style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {place.name}
                        </p>
                        <p style={{ fontSize: 10, color: '#94A3B8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {place.location}
                        </p>
                      </div>
                      {isActive && <span style={{ fontSize: 11, color: '#3B82F6', fontWeight: 700 }}>✓</span>}
                    </div>
                  )
                })
              ) : (
                // Full card grid
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16, padding: 16 }}>
                  {filtered.map(place => {
                    const catColor    = CAT_COLOR[place.category]  || '#3B82F6'
                    const seasonColor = SEASON_COLOR[place.season] || '#64748B'
                    return (
                      <div
                        key={place.id}
                        onClick={() => setSelected(place)}
                        style={{
                          borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                          background: '#fff', border: '0.5px solid #E2E8F0',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'
                        }}
                      >
                        {/* Image */}
                        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                          <img
                            src={place.image} alt={place.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80'
                            }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(15,23,42,0.7) 0%,transparent 50%)' }} />
                          <span style={{
                            position: 'absolute', top: 8, left: 8,
                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                            background: catColor + '22', color: catColor,
                            border: `1px solid ${catColor}35`, backdropFilter: 'blur(4px)',
                          }}>
                            {place.category}
                          </span>
                          <span style={{
                            position: 'absolute', bottom: 8, right: 8,
                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                            background: 'rgba(0,0,0,0.5)', color: '#FCD34D',
                          }}>
                            ⭐ {place.rating}
                          </span>
                          <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 14 }} title="India">🇮🇳</span>
                        </div>

                        {/* Info */}
                        <div style={{ padding: '12px 14px' }}>
                          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {place.name}
                          </h3>
                          <p style={{ fontSize: 10, color: '#94A3B8', margin: '3px 0 0' }}>
                            📍 {place.location}
                          </p>
                          <p style={{ fontSize: 11, color: '#64748B', margin: '8px 0 0', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {place.description}
                          </p>

                          {/* Stats */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: seasonColor }}>
                              🗓 {SEASON_MONTHS[place.season]}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: DIFF_COLOR[place.difficulty] || '#94A3B8' }}>
                              {place.difficulty}
                            </span>
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>
                              💰 {place.currency} {parseInt(place.budget).toLocaleString()}
                            </span>
                          </div>

                          {/* Highlights */}
                          {place.highlights && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                              {place.highlights.split(',').slice(0, 3).map((h, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: 9, padding: '2px 7px', borderRadius: 6, fontWeight: 600,
                                    background: `${catColor}10`, color: catColor,
                                    border: `0.5px solid ${catColor}20`,
                                  }}
                                >
                                  {h.trim()}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                window.open(
                                  `https://www.google.com/maps/dir/?api=1${
                                    userLocation
                                      ? `&origin=${userLocation.lat},${userLocation.lng}`
                                      : ''
                                  }&destination=${place.lat},${place.lng}`,
                                  '_blank'
                                )
                              }}
                              style={{
                                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                                fontSize: 11, fontWeight: 700, color: '#fff',
                                background: catColor, cursor: 'pointer',
                              }}
                            >
                              🧭 Directions
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
                                  '_blank'
                                )
                              }}
                              style={{
                                padding: '8px 12px', borderRadius: 8,
                                fontSize: 12, background: '#F8FAFC', border: '0.5px solid #E2E8F0',
                                cursor: 'pointer', color: '#64748B',
                              }}
                            >
                              🗺️
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Detail Panel ──────────────────────────────────── */}
          {selected && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}>

              {/* Hero image */}
              <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
                <img
                  src={selected.image} alt={selected.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80'
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(248,250,252,1) 0%,rgba(248,250,252,0.3) 50%,transparent 100%)' }} />

                <button
                  onClick={() => setSelected(null)}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#fff', border: '0.5px solid #E2E8F0',
                    fontSize: 14, fontWeight: 700, color: '#64748B',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  ×
                </button>

                <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '0 20px 20px' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                      background: (CAT_COLOR[selected.category] || '#3B82F6') + '20',
                      color: CAT_COLOR[selected.category] || '#3B82F6',
                      border: `0.5px solid ${CAT_COLOR[selected.category] || '#3B82F6'}30`,
                    }}>{selected.category}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                      background: '#FEF3C720', color: '#D97706', border: '0.5px solid #FDE68A',
                    }}>{selected.season}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                      background: '#FFF7ED', color: '#EA580C', border: '0.5px solid #FED7AA',
                    }}>🇮🇳 India</span>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>{selected.name}</h2>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                    📍 {selected.location} · ⭐ {selected.rating}
                  </p>
                </div>
              </div>

              {/* Detail body */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>{selected.description}</p>

                {/* Best time */}
                <div style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: '#EFF6FF', border: '0.5px solid #BFDBFE',
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#1D4ED8', letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 4px' }}>
                    📅 Best Time to Visit
                  </p>
                  <p style={{ fontSize: 12, color: '#1E40AF', margin: 0 }}>
                    <strong>{selected.season}</strong> — {SEASON_MONTHS[selected.season]}.
                    {selected.tips ? ` ${selected.tips.split('.')[0]}.` : ''}
                  </p>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { l: 'Budget',     v: `${selected.currency} ${parseInt(selected.budget).toLocaleString()}`, icon: '💰' },
                    { l: 'Duration',   v: `${selected.days} days`,   icon: '🕐' },
                    { l: 'Transport',  v: selected.transport,        icon: '✈️' },
                    { l: 'Difficulty', v: selected.difficulty,       icon: '🥾', color: DIFF_COLOR[selected.difficulty] },
                    { l: 'Best Month', v: SEASON_MONTHS[selected.season], icon: '🗓' },
                    { l: 'Rating',     v: `⭐ ${selected.rating}`,   icon: '🏅' },
                  ].map((d, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: '#fff', border: '0.5px solid #E2E8F0' }}>
                      <p style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>
                        {d.icon} {d.l}
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: (d as any).color || '#0F172A', margin: 0 }}>
                        {d.v}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Highlights */}
                {selected.highlights && (
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: '#F0FDF4', border: '0.5px solid #BBF7D0' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#166534', letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>
                      🏆 Key Highlights
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selected.highlights.split(',').map((h, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 500,
                          background: '#DCFCE7', color: '#166534', border: '0.5px solid #86EFAC',
                        }}>
                          {h.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {selected.tips && (
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: '#FFFBEB', border: '0.5px solid #FDE68A' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#D97706', letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 6px' }}>
                      💡 Tour Guide Tips
                    </p>
                    <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.7, margin: 0 }}>{selected.tips}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1${
                          userLocation
                            ? `&origin=${userLocation.lat},${userLocation.lng}`
                            : ''
                        }&destination=${selected.lat},${selected.lng}`,
                        '_blank'
                      )
                    }
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                      fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                      background: `linear-gradient(135deg,${CAT_COLOR[selected.category] || '#3B82F6'},#6366F1)`,
                    }}
                  >
                    🧭 Get Directions
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`,
                        '_blank'
                      )
                    }
                    style={{
                      padding: '12px 16px', borderRadius: 10, border: '0.5px solid #E2E8F0',
                      fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer',
                      background: '#fff',
                    }}
                  >
                    🗺️ View Map
                  </button>
                </div>

                <div style={{ height: 8 }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   STYLES — matching dashboard light theme
════════════════════════════════════════ */
const S: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', height: '100vh', overflow: 'hidden',
    background: '#F8FAFC',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
  },

  /* sidebar — exact copy from dashboard */
  sidebar: {
    width: 220, background: '#0F172A', display: 'flex', flexDirection: 'column',
    flexShrink: 0, borderRight: '0.5px solid #1E293B',
  },
  sbBrand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 16px 16px', borderBottom: '0.5px solid #1E293B',
  },
  sbLogo: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
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
    marginBottom: 2, transition: 'background 0.15s',
  },
  navIcon: {
    width: 28, height: 28, borderRadius: 6, background: '#1E293B',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0,
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

  /* main */
  main:   { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: {
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
  pillAmber: { background: '#FFFBEB', color: '#D97706', border: '0.5px solid #FDE68A' },
  pillBlue:  { background: '#EFF6FF', color: '#1D4ED8', border: '0.5px solid #BFDBFE' },

  leftPanel: {
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: '#fff', borderRight: '0.5px solid #E2E8F0',
    transition: 'width 0.4s ease', flexShrink: 0,
  },

  filterBar: {
    padding: '14px 16px',
    borderBottom: '0.5px solid #E2E8F0',
  },

  searchInput: {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12,
    background: '#F8FAFC', border: '0.5px solid #E2E8F0', color: '#0F172A',
    outline: 'none', boxSizing: 'border-box',
  },
}

export default function TourPicksPage() {
  return <AuthGuard><TourPicksContent /></AuthGuard>
}