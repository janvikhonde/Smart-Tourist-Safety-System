'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'

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

// ── Nearby Places Types ───────────────────────────────────────────────────────
interface NearbyPlace {
  id: number
  name: string
  type: string
  lat: number
  lng: number
  address?: string
  distance?: number
  tags: Record<string, string>
}

interface NearbyCategory {
  key: string
  label: string
  emoji: string
  color: string
  bgColor: string
  overpassQuery: (lat: number, lng: number, r: number) => string
}

const NEARBY_CATEGORIES: NearbyCategory[] = [
  {
    key: 'hospital', label: 'Hospitals', emoji: '🏥', color: '#dc2626', bgColor: '#fee2e2',
    overpassQuery: (lat, lng, r) => `[out:json][timeout:25];(node["amenity"~"hospital|clinic|pharmacy|doctors"](around:${r},${lat},${lng});way["amenity"~"hospital|clinic"](around:${r},${lat},${lng}););out center;`,
  },
  {
    key: 'police', label: 'Police', emoji: '🚔', color: '#1d4ed8', bgColor: '#dbeafe',
    overpassQuery: (lat, lng, r) => `[out:json][timeout:25];(node["amenity"="police"](around:${r},${lat},${lng});way["amenity"="police"](around:${r},${lat},${lng}););out center;`,
  },
  {
    key: 'hotel', label: 'Hotels & Stays', emoji: '🏨', color: '#7c3aed', bgColor: '#ede9fe',
    overpassQuery: (lat, lng, r) => `[out:json][timeout:25];(node["tourism"~"hotel|hostel|guest_house|motel|lodge"](around:${r},${lat},${lng});way["tourism"~"hotel|hostel|guest_house"](around:${r},${lat},${lng}););out center;`,
  },
  {
    key: 'food', label: 'Food & Cafes', emoji: '🍽️', color: '#d97706', bgColor: '#fef3c7',
    overpassQuery: (lat, lng, r) => `[out:json][timeout:25];(node["amenity"~"restaurant|cafe|fast_food|food_court|bar"](around:${r},${lat},${lng}););out center;`,
  },
  {
    key: 'tourist', label: 'Tourist Spots', emoji: '🏛️', color: '#059669', bgColor: '#d1fae5',
    overpassQuery: (lat, lng, r) => `[out:json][timeout:25];(node["tourism"~"attraction|museum|monument|viewpoint|artwork|gallery"](around:${r},${lat},${lng});way["tourism"~"attraction|museum"](around:${r},${lat},${lng}););out center;`,
  },
  {
    key: 'transport', label: 'Transport', emoji: '🚌', color: '#0891b2', bgColor: '#cffafe',
    overpassQuery: (lat, lng, r) => `[out:json][timeout:25];(node["amenity"~"bus_station|taxi|fuel"](around:${r},${lat},${lng});node["highway"="bus_stop"](around:${r},${lat},${lng}););out center;`,
  },
]

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function formatDistance(m: number): string { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m` }

function getPlaceName(tags: Record<string, string>): string {
  return tags.name || tags['name:en'] || tags.brand || 'Unnamed Place'
}

function getPlaceAddress(tags: Record<string, string>): string {
  return [tags['addr:housename'], tags['addr:street'], tags['addr:suburb'], tags['addr:city']].filter(Boolean).join(', ') || tags.description || ''
}

const mapRegistry = new WeakMap<HTMLElement, any>()

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

// ── Main Component ────────────────────────────────────────────────────────────
function PlacesContent() {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInst     = useRef<any>(null)
  const routeRef    = useRef<any>(null)
  const destMarker  = useRef<any>(null)

  const [location,      setLocation]      = useState<{ lat: number; lng: number } | null>(null)
  const [activecat,     setActivecat]     = useState('hospital')
  const [nearbyPlaces,  setNearbyPlaces]  = useState<NearbyPlace[]>([])
  const [loading,       setLoading]       = useState(true)
  const [searching,     setSearching]     = useState(false)
  const [selected,      setSelected]      = useState<NearbyPlace | null>(null)
  // Increased default radius to 10km, max to 25km, show up to 100 places
  const [radius,        setRadius]        = useState(10000)
  const [mapReady,      setMapReady]      = useState(false)
  const [routeLoading,  setRouteLoading]  = useState(false)

  const cat     = NEARBY_CATEGORIES.find(c => c.key === activecat)!
  const showMap = selected !== null

  // ── Get user live location ────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 19.8762, lng: 75.3433 })
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => {
        setLocation({ lat: 19.8762, lng: 75.3433 })
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }, [])

  // ── Leaflet map init ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!showMap || !location || !mapRef.current) return
    const container = mapRef.current
    if (mapRegistry.has(container)) { setMapReady(true); return }

    const initLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'; link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (!document.getElementById('places-map-style')) {
        const style = document.createElement('style')
        style.id = 'places-map-style'
        style.textContent = `.leaflet-container{background:#e8edf2!important;}.pm-tooltip{background:#1e293b!important;border:none!important;color:#f1f5f9!important;font-size:11px!important;font-weight:600!important;padding:4px 10px!important;border-radius:6px!important;}.pm-tooltip::before{display:none!important;}.leaflet-control-zoom a{background:#fff!important;color:#334155!important;border:1px solid #e2e8f0!important;}`
        document.head.appendChild(style)
      }
      const loadL = () => new Promise<any>(resolve => {
        if ((window as any).L) { resolve((window as any).L); return }
        if (document.getElementById('leaflet-js')) {
          const poll = setInterval(() => { if ((window as any).L) { clearInterval(poll); resolve((window as any).L) } }, 100)
          return
        }
        const s = document.createElement('script')
        s.id = 'leaflet-js'; s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        s.async = true; s.onload = () => resolve((window as any).L)
        document.head.appendChild(s)
      })

      const L = await loadL();
      (container as any)._leaflet_id = null
      const map = L.map(container, { center: [location.lat, location.lng], zoom: 13, zoomControl: true })
      mapInst.current = map
      mapRegistry.set(container, map)

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 19,
      }).addTo(map)

      L.marker([location.lat, location.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.2);"></div>`,
          iconSize: [18, 18], iconAnchor: [9, 9],
        }),
        zIndexOffset: 999,
      }).addTo(map).bindTooltip('📍 You are here', { direction: 'top', className: 'pm-tooltip', offset: [0, -12] })

      setMapReady(true)
    }

    initLeaflet()

    return () => {
      const el = mapRef.current; if (!el) return
      const m = mapRegistry.get(el)
      if (m) { m.remove(); mapRegistry.delete(el) }
      mapInst.current = null; routeRef.current = null; destMarker.current = null
      setMapReady(false)
    }
  }, [showMap, location])

  // ── Draw route ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !selected || !location || !mapInst.current) return
    const L = (window as any).L; if (!L) return

    if (routeRef.current)  { routeRef.current.remove();  routeRef.current  = null }
    if (destMarker.current){ destMarker.current.remove(); destMarker.current = null }

    destMarker.current = L.marker([selected.lat, selected.lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="filter:drop-shadow(0 4px 10px ${cat.color}66);">
          <svg viewBox="0 0 32 40" width="32" height="40">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 11.5 16 24 16 24S32 27.5 32 16C32 7.163 24.837 0 16 0z" fill="${cat.color}"/>
            <text x="16" y="20" text-anchor="middle" font-size="13" fill="white">${cat.emoji}</text>
          </svg></div>`,
        iconSize: [32, 40], iconAnchor: [16, 40],
      }),
      zIndexOffset: 500,
    }).addTo(mapInst.current)
      .bindTooltip(selected.name, { direction: 'top', className: 'pm-tooltip', offset: [0, -42] })
      .openTooltip()

    const fetchRoute = async () => {
      setRouteLoading(true)
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${location.lng},${location.lat};${selected.lng},${selected.lat}?overview=full&geometries=geojson`
        )
        const data = await res.json()
        if (data.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng])
          routeRef.current = L.polyline(coords, {
            color: cat.color, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round',
          }).addTo(mapInst.current)
          mapInst.current.fitBounds(
            L.latLngBounds([[location.lat, location.lng], [selected.lat, selected.lng], ...coords]),
            { padding: [50, 50] }
          )
        } else {
          routeRef.current = L.polyline([[location.lat, location.lng], [selected.lat, selected.lng]], {
            color: cat.color, weight: 4, opacity: 0.7, dashArray: '10 8',
          }).addTo(mapInst.current)
          mapInst.current.fitBounds(routeRef.current.getBounds(), { padding: [60, 60] })
        }
      } catch {
        routeRef.current = L.polyline([[location.lat, location.lng], [selected.lat, selected.lng]], {
          color: cat.color, weight: 4, opacity: 0.7, dashArray: '10 8',
        }).addTo(mapInst.current)
        mapInst.current.fitBounds(routeRef.current.getBounds(), { padding: [60, 60] })
      } finally {
        setRouteLoading(false)
      }
    }
    fetchRoute()
  }, [mapReady, selected])

  useEffect(() => {
    if (mapReady && mapInst.current) setTimeout(() => mapInst.current?.invalidateSize(), 100)
  }, [mapReady, showMap])

  // ── Fetch nearby via Overpass — show ALL results (up to 100) ─────────────
  const fetchNearby = useCallback(async (catKey: string, loc: { lat: number; lng: number }, r: number) => {
    const category = NEARBY_CATEGORIES.find(c => c.key === catKey)
    if (!category) return
    setSearching(true); setNearbyPlaces([]); setSelected(null)
    try {
      const query = category.overpassQuery(loc.lat, loc.lng, r)
      const res   = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      const data  = await res.json()
      const results: NearbyPlace[] = []
      data.elements?.forEach((el: any) => {
        const lat = el.lat ?? el.center?.lat
        const lng = el.lon ?? el.center?.lon
        if (!lat || !lng) return
        const name = getPlaceName(el.tags ?? {})
        if (name === 'Unnamed Place') return
        results.push({
          id: el.id, name,
          type: el.tags?.amenity || el.tags?.tourism || el.tags?.highway || catKey,
          lat, lng,
          address:  getPlaceAddress(el.tags ?? {}),
          distance: getDistance(loc.lat, loc.lng, lat, lng),
          tags:     el.tags ?? {},
        })
      })
      results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      // Show ALL results (up to 100 instead of 30)
      setNearbyPlaces(results.slice(0, 100))
    } catch (e) {
      console.error(e)
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (location) fetchNearby(activecat, location, radius)
  }, [activecat, radius, location, fetchNearby])

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#F8FAFC' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748B', fontSize: 13, fontFamily: 'system-ui' }}>Getting your location…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>
        {/* ── TopBar ── */}
        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>Nearby Places</h1>
            <p style={S.tbSub}>Live location-based search with directions</p>
          </div>
          <div style={S.tbRight}>
            {location && (
              <span style={{ ...S.pill, ...S.pillBlue }}>
                <span style={{ ...S.dot, background: '#3B82F6' }} />
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            )}
            <span style={{ ...S.pill, ...S.pillGreen }}>
              <span style={{ ...S.dot, background: '#22C55E' }} /> Live
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left Panel ─────────────────────────────────────────────── */}
          <div style={{
            ...S.leftPanel,
            width: showMap ? '340px' : '100%',
          }}>

            {/* Category tabs */}
            <div style={S.catBar}>
              <p style={S.secLabel}>Category</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {NEARBY_CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setActivecat(c.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: showMap ? '6px 8px' : '6px 12px',
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                      background: activecat === c.key ? c.color : '#F1F5F9',
                      color: activecat === c.key ? '#fff' : '#64748B',
                    }}
                  >
                    <span>{c.emoji}</span>
                    {!showMap && <span>{c.label}</span>}
                    {activecat === c.key && !searching && nearbyPlaces.length > 0 && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 5px',
                        borderRadius: 99, background: 'rgba(255,255,255,0.25)', color: '#fff',
                      }}>
                        {nearbyPlaces.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius slider */}
            <div style={S.radiusBar}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ ...S.secLabel, margin: 0 }}>Search radius</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>
                  {(radius / 1000).toFixed(0)} km
                </span>
              </div>
              <input
                type="range" min={1000} max={25000} step={1000} value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: cat.color }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 9, color: '#94A3B8' }}>1 km</span>
                <span style={{ fontSize: 9, color: '#94A3B8' }}>25 km</span>
              </div>
            </div>

            {/* Result count */}
            {!searching && nearbyPlaces.length > 0 && (
              <div style={{ padding: '8px 16px', borderBottom: '0.5px solid #E2E8F0' }}>
                <p style={{ fontSize: 10, color: '#64748B', margin: 0, fontWeight: 500 }}>
                  {nearbyPlaces.length} {cat.label.toLowerCase()} found · tap any to see route
                </p>
              </div>
            )}

            {/* Searching */}
            {searching && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10 }}>
                <div style={{ width: 24, height: 24, border: `3px solid ${cat.color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Searching {cat.label.toLowerCase()}…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Empty */}
            {!searching && nearbyPlaces.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 8 }}>
                <span style={{ fontSize: 32, opacity: 0.2 }}>{cat.emoji}</span>
                <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '0 24px', lineHeight: 1.6, margin: 0 }}>
                  No {cat.label.toLowerCase()} found within {(radius/1000).toFixed(0)} km.<br />Try increasing the radius.
                </p>
              </div>
            )}

            {/* Place list */}
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}>
              {!searching && nearbyPlaces.map((place, i) => {
                const isSelected = selected?.id === place.id
                return (
                  <div
                    key={place.id}
                    onClick={() => setSelected(prev => prev?.id === place.id ? null : place)}
                    style={{
                      padding: '10px 16px', borderBottom: '0.5px solid #F1F5F9',
                      background: isSelected ? `${cat.color}08` : '#fff',
                      cursor: 'pointer', transition: 'background 0.15s',
                      borderLeft: isSelected ? `3px solid ${cat.color}` : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      {/* Rank */}
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: isSelected ? cat.color : '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: isSelected ? '#fff' : '#94A3B8',
                      }}>
                        {i + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {place.name}
                        </p>
                        {place.address && (
                          <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {place.address}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: cat.color }}>
                            🚶 {formatDistance(place.distance ?? 0)}
                          </span>
                          {place.tags?.opening_hours && (
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>
                              🕐 {place.tags.opening_hours.slice(0, 20)}
                            </span>
                          )}
                          {place.tags?.phone && (
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>📞 {place.tags.phone}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        {isSelected ? (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                            background: `${cat.color}15`, color: cat.color,
                          }}>✓ Viewing</span>
                        ) : (
                          <span style={{
                            fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 6,
                            background: '#F8FAFC', color: '#CBD5E1', border: '0.5px solid #E2E8F0',
                          }}>Route →</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Map Panel ──────────────────────────────────────────────── */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: showMap ? 'block' : 'none' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#e8edf2' }} />

            {/* Route loading overlay */}
            {routeLoading && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 2000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(4px)',
              }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  padding: '20px 28px', borderRadius: 14, background: '#fff',
                  border: `1px solid ${cat.color}30`, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}>
                  <div style={{ width: 28, height: 28, border: `3px solid ${cat.color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontWeight: 500 }}>Calculating route…</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              </div>
            )}

            {/* Selected place info bar */}
            {selected && !routeLoading && (
              <div style={{
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                zIndex: 1000, borderRadius: 14, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#fff', border: `1px solid ${cat.color}25`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                maxWidth: '420px', width: 'calc(100% - 32px)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: cat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {cat.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.name}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>
                    🚶 {formatDistance(selected.distance ?? 0)} away
                    {selected.address ? ` · ${selected.address}` : ''}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${location?.lat},${location?.lng}&destination=${selected.lat},${selected.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    color: '#fff', background: cat.color, textDecoration: 'none', flexShrink: 0,
                  }}
                >
                  Google Maps →
                </a>
              </div>
            )}

            {/* Back to list */}
            <button
              onClick={() => setSelected(null)}
              style={{
                position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: '#fff', color: '#64748B', border: '0.5px solid #E2E8F0',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              ← Back to list
            </button>

            {/* Centre on destination */}
            <button
              onClick={() => selected && mapInst.current?.setView([selected.lat, selected.lng], 15)}
              style={{
                position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
                width: 40, height: 40, borderRadius: 10, fontSize: 18,
                background: '#fff', border: '0.5px solid #E2E8F0',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              🎯
            </button>

            {/* LIVE badge */}
            <div style={{
              position: 'absolute', top: 12, right: 12, zIndex: 1000,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 99, fontSize: 10, fontWeight: 700,
              background: '#fff', color: '#dc2626', border: '0.5px solid #FECDD3',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <span style={{ width: 6, height: 6, background: '#EF4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              LIVE
              <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }`}</style>
            </div>
          </div>

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
  pillGreen: { background: '#F0FDF4', color: '#166534', border: '0.5px solid #BBF7D0' },
  pillBlue:  { background: '#EFF6FF', color: '#1D4ED8', border: '0.5px solid #BFDBFE' },
  dot:       { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' },

  leftPanel: {
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: '#fff', borderRight: '0.5px solid #E2E8F0', transition: 'width 0.4s ease',
    flexShrink: 0,
  },

  catBar: {
    padding: '14px 16px 10px',
    borderBottom: '0.5px solid #E2E8F0',
  },

  radiusBar: {
    padding: '10px 16px 12px',
    borderBottom: '0.5px solid #E2E8F0',
  },

  secLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#94A3B8',
    textTransform: 'uppercase', margin: '0 0 8px',
  },
}

export default function PlacesPage() {
  return <AuthGuard><PlacesContent /></AuthGuard>
}
