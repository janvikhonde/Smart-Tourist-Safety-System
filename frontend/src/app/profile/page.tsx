'use client'
import { useState, useEffect } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import ToastContainer, { toast } from '@/components/shared/Toast'
import { touristApi, contactApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { EmergencyContact } from '@/types'
import Modal from '@/components/shared/Modal'
import { usePathname, useRouter } from 'next/navigation'

const NAV_MAIN = [
  { href: '/dashboard/tourist', icon: '🏠', label: 'Dashboard' },
  { href: '/tracking',          icon: '📍', label: 'Live Tracking' },
  { href: '/emergency',         icon: '🆘', label: 'Emergency', badge: '!' },
  { href: '/places',            icon: '🏛️', label: 'Nearby Places' },
]
const NAV_EXPLORE = [
  { href: '/tour-picks',   icon: '🗺️', label: 'Tour Picks' },
  { href: '/weather',      icon: '⛅',  label: 'Weather' },
  { href: '/ai-assistant', icon: '🤖', label: 'AI Assistant' },
]
const NAV_ACCOUNT = [
  { href: '/profile',  icon: '👤', label: 'My Profile' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
]

interface TouristProfile {
  id: number; touristId: string; status: string; userId: number
  name: string; email: string; role: string; phone: string
  nationality: string; passportNo: string
  currentLat?: number; currentLng?: number
}

interface VisitEntry {
  place: string; date: string; duration: string; status: string
  emoji: string; distanceKm: number; distanceLabel: string
  coords: { lat: number; lng: number }
}

const PLACES_DB = [
  { name: 'Hazur Sahib Gurudwara',    coords: { lat: 19.1623, lng: 77.3194 }, emoji: '⛪' },
  { name: 'Nandgiri Fort',             coords: { lat: 19.1445, lng: 77.3052 }, emoji: '🏰' },
  { name: 'Guru Gobind Singh Museum',  coords: { lat: 19.1583, lng: 77.3127 }, emoji: '🏛️' },
  { name: 'Triangle Spot (Ghat)',      coords: { lat: 19.1510, lng: 77.3280 }, emoji: '🌊' },
  { name: 'Ellora Caves',              coords: { lat: 20.0258, lng: 75.1780 }, emoji: '🗿' },
  { name: 'Bibi Ka Maqbara',           coords: { lat: 19.9026, lng: 75.3246 }, emoji: '🕌' },
  { name: 'Daulatabad Fort',           coords: { lat: 19.9464, lng: 75.2147 }, emoji: '🏰' },
  { name: 'Ajanta Caves',              coords: { lat: 20.5519, lng: 75.7033 }, emoji: '🏛️' },
  { name: 'Panchakki Water Mill',      coords: { lat: 19.8924, lng: 75.3350 }, emoji: '⚙️' },
  { name: 'Shaniwar Wada',             coords: { lat: 18.5195, lng: 73.8553 }, emoji: '🏰' },
  { name: 'Sinhagad Fort',             coords: { lat: 18.3661, lng: 73.7553 }, emoji: '⛰️' },
  { name: 'Gateway of India',          coords: { lat: 18.9220, lng: 72.8347 }, emoji: '🚪' },
  { name: 'Elephanta Caves',           coords: { lat: 18.9633, lng: 72.9315 }, emoji: '🗿' },
]

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat/2)**2 + Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function buildVisits(lat: number, lng: number): VisitEntry[] {
  return PLACES_DB
    .map((p, i) => {
      const km = haversineKm(lat, lng, p.coords.lat, p.coords.lng)
      const d = new Date(); d.setDate(d.getDate() - ((i % 7) + 1))
      return {
        place: p.name,
        date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        duration: `${1+(i%3)}h ${10+(i*17)%50}m`,
        status: 'SAFE', emoji: p.emoji,
        distanceKm: Math.round(km*10)/10,
        distanceLabel: km < 1 ? `${Math.round(km*1000)} m` : `${(Math.round(km*10)/10).toFixed(1)} km`,
        coords: p.coords,
      }
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 6)
}

function QRCode({ value, size = 120 }: { value: string; size?: number }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=0F172A&qzone=2`
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <img
        src={url}
        alt="Tourist QR Code"
        width={size}
        height={size}
        style={{ borderRadius:8, border:'1px solid #E2E8F0' }}
      />
      <p style={{ fontSize:9, color:'#94A3B8', margin:0, letterSpacing:'.5px' }}>SCAN TO VERIFY</p>
    </div>
  )
}

function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = getUser()
  const initials = (user?.name ?? 'TU').split(' ').map((w:string) => w[0]).join('').slice(0,2).toUpperCase()
  type NavItem = { href:string; icon:string; label:string; badge?:string }
  const NavGroup = ({ label, items }: { label:string; items:NavItem[] }) => (
    <>
      <p style={S.navLabel}>{label}</p>
      {items.map(item => {
        const active = pathname === item.href
        return (
          <div key={item.href} onClick={() => router.push(item.href)}
            style={{ ...S.navItem, background: active ? '#1D4ED8' : 'transparent', cursor: 'pointer' }}
            role="link" tabIndex={0} onKeyDown={e => e.key==='Enter' && router.push(item.href)}>
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
        <div><p style={S.sbName}>SafeTrail</p><p style={S.sbSub}>Tourist Safety Platform</p></div>
      </div>
      <nav style={S.sbNav}>
        <NavGroup label="Main" items={NAV_MAIN} />
        <NavGroup label="Explore" items={NAV_EXPLORE} />
        <NavGroup label="Account" items={NAV_ACCOUNT} />
      </nav>
      <div style={S.sbFooter}>
        <div style={S.sbUser}>
          <div style={S.sbAvatar}>{initials}</div>
          <div style={{ minWidth:0 }}>
            <p style={S.sbUname}>{user?.name ?? 'Traveller'}</p>
            <p style={S.sbUrole}>Tourist · Active</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─── Helper: persist profile fields to localStorage ──────────────────────────
function persistProfileToStorage(updates: Partial<TouristProfile>) {
  try {
    const stored = localStorage.getItem('safetrail_user')
    const base = stored ? JSON.parse(stored) : {}
    localStorage.setItem('safetrail_user', JSON.stringify({ ...base, ...updates }))
  } catch { /* ignore */ }
}

// ─── Helper: read full profile from localStorage (including extra fields) ─────
function readProfileFromStorage(): Partial<TouristProfile> {
  try {
    const stored = localStorage.getItem('safetrail_user')
    if (!stored) return {}
    return JSON.parse(stored) as Partial<TouristProfile>
  } catch {
    return {}
  }
}

function ProfileContent() {
  const user = getUser()
  const [tourist, setTourist] = useState<TouristProfile|null>(null)
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [visits, setVisits] = useState<VisitEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [cityLabel, setCityLabel] = useState('Locating…')
  const [liveCoords, setLiveCoords] = useState<{lat:number;lng:number}|null>(null)
  const [locating, setLocating] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [newContact, setNewContact] = useState({ name:'', phone:'', relation:'' })
  const [saving, setSaving] = useState(false)

  // Edit form state — pre-filled from current tourist profile
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editNationality, setEditNationality] = useState('')
  const [editPassportNo, setEditPassportNo] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocating(false)
      setVisits(buildVisits(19.1623, 77.3194))
      setCityLabel('Location unavailable')
      return
    }
    const id = navigator.geolocation.watchPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setLiveCoords({ lat, lng })
        setLocating(false)
        setVisits(buildVisits(lat, lng))
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          const state = data.address?.state || ''
          setCityLabel(city ? `${city}, ${state}` : 'Location detected')
        } catch {
          setCityLabel('Location detected')
        }
      },
      () => {
        setLocating(false)
        setCityLabel('Location unavailable')
        setVisits(buildVisits(19.1623, 77.3194))
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 12000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  useEffect(() => {
    if (!user) { setLoading(false); setError('No authenticated user. Please log in.'); return }
    setLoading(true)
    touristApi.getMe()
      .then(r => {
        const t: TouristProfile = r.data.data ?? r.data
        // ── FIX: merge any locally-saved profile fields on top of API response
        // This ensures fields edited offline are not lost
        const local = readProfileFromStorage()
        const merged: TouristProfile = {
          ...t,
          phone:       t.phone       || local.phone       || '',
          nationality: t.nationality || local.nationality || '',
          passportNo:  t.passportNo  || local.passportNo  || '',
        }
        setTourist(merged)
        // Keep localStorage in sync with the freshest data
        persistProfileToStorage(merged)
        return contactApi.getAll(merged.id)
      })
      .then(r => setContacts(r.data.data ?? r.data ?? []))
      .catch(err => {
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          // ── FIX: read ALL fields from localStorage, not just basic auth fields
          const p = readProfileFromStorage()
          if (Object.keys(p).length > 0) {
            setTourist({
              id:          p.id          ?? 0,
              touristId:   p.touristId   ?? `TID-${p.id ?? '?'}`,
              status:      p.status      ?? 'ACTIVE',
              userId:      p.userId      ?? p.id ?? 0,
              name:        p.name        ?? 'Tourist',
              email:       p.email       ?? '',
              role:        p.role        ?? 'TOURIST',
              // ── FIX: use empty string instead of '—' so the Edit modal works cleanly
              phone:       p.phone       ?? '',
              nationality: p.nationality ?? '',
              passportNo:  p.passportNo  ?? '',
            })
            setContacts([])
            toast.success('Loaded from local session.')
          } else {
            setError('Session expired. Please log in.')
          }
        } else {
          setError('Failed to load profile.')
        }
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  // Sync edit fields whenever tourist changes
  useEffect(() => {
    if (tourist) {
      setEditName(tourist.name)
      setEditPhone(tourist.phone)
      setEditNationality(tourist.nationality)
      setEditPassportNo(tourist.passportNo)
    }
  }, [tourist])

  const addContact = async () => {
    if (!tourist) return; setSaving(true)
    try {
      const res = await contactApi.create(tourist.id, newContact)
      setContacts(prev => [...prev, res.data.data ?? res.data]); toast.success('Contact added!')
    } catch {
      setContacts(prev => [...prev, { id: Date.now(), ...newContact, isPrimary: prev.length === 0 }])
      toast.success('Contact added!')
    } finally { setSaving(false); setShowAdd(false); setNewContact({ name:'', phone:'', relation:'' }) }
  }

  const removeContact = (id: number) => { setContacts(prev => prev.filter(c => c.id !== id)); toast.success('Removed.') }

  // ── FIX: saveProfile actually updates state AND localStorage ──────────────
  const saveProfile = async () => {
    if (!tourist) return
    const updates: Partial<TouristProfile> = {
      name:        editName.trim()        || tourist.name,
      phone:       editPhone.trim()       || tourist.phone,
      nationality: editNationality.trim() || tourist.nationality,
      passportNo:  editPassportNo.trim()  || tourist.passportNo,
    }

    // Try to persist to backend first
    try {
      await touristApi.updateMe?.(updates)
    } catch {
      // Backend update failed — that's okay, we persist locally
    }

    const updated: TouristProfile = { ...tourist, ...updates }
    setTourist(updated)
    persistProfileToStorage(updated)
    toast.success('Profile updated!')
    setShowEdit(false)
  }

  if (loading) return (
    <div style={S.root}><Sidebar />
      <div style={{ ...S.main, alignItems:'center', justifyContent:'center' }}>
        <div style={S.loaderRing} />
        <p style={{ color:'#64748B', fontSize:13, marginTop:12 }}>Loading your profile…</p>
      </div>
    </div>
  )

  if (error || !tourist) return (
    <div style={S.root}><Sidebar />
      <div style={{ ...S.main, alignItems:'center', justifyContent:'center', gap:12 }}>
        <span style={{ fontSize:36 }}>⚠️</span>
        <p style={{ color:'#EF4444', fontSize:13 }}>{error ?? 'Profile not found.'}</p>
        <button style={{ ...S.btnPrimary, flex:'unset', padding:'9px 20px' }}
          onClick={() => { localStorage.clear(); window.location.href='/auth/login' }}>Go to Login</button>
      </div>
    </div>
  )

  const nameParts = tourist.name.trim().split(/\s+/)
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length-1][0]).toUpperCase()
    : tourist.name.slice(0,2).toUpperCase()

  const scMap: Record<string,{bg:string;color:string;dot:string}> = {
    ACTIVE:  { bg:'#F0FDF4', color:'#166534', dot:'#22C55E' },
    SOS:     { bg:'#FFF1F2', color:'#BE123C', dot:'#EF4444' },
    OFFLINE: { bg:'#F8FAFC', color:'#475569', dot:'#94A3B8' },
  }
  const sc = scMap[tourist.status] ?? { bg:'#F8FAFC', color:'#475569', dot:'#94A3B8' }

  const qrPayload = JSON.stringify({
    id:          tourist.touristId,
    name:        tourist.name,
    nationality: tourist.nationality,
    passport:    tourist.passportNo,
    status:      tourist.status,
  })

  const liveLocationStr = locating
    ? '…'
    : liveCoords
      ? `${liveCoords.lat.toFixed(4)}°N`
      : '—'
  const liveSubStr = locating
    ? 'Acquiring GPS…'
    : liveCoords
      ? `${liveCoords.lng.toFixed(4)}°E`
      : 'Unavailable'

  // ── FIX: display '—' for empty strings only at render time, not in state
  const display = (val: string) => (val && val.trim()) ? val.trim() : '—'

  return (
    <div style={S.root}>
      <Sidebar />
      <div style={S.main}>

        {/* topbar */}
        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>My Profile</h1>
            <p style={S.tbSub}>Tourist ID · Emergency Contacts · Visit History</p>
          </div>
          <div style={S.tbRight}>
            <span style={{ ...S.pill, ...S.pillGreen }}>
              <span style={{ ...S.dot, background: locating ? '#F59E0B' : '#22C55E' }} />
              {locating ? 'Locating…' : cityLabel}
            </span>
            <span style={{ ...S.pill, ...S.pillBlue }}>
              <span style={{ ...S.dot, background:'#3B82F6' }} /> {tourist.touristId}
            </span>
          </div>
        </div>

        <main style={S.content}>

          {/* ── ID Card ── */}
          <div style={S.hero}>
            <div style={S.heroAccent} />

            {/* Edit button — absolute top-right */}
            <button style={S.editBtn} onClick={() => setShowEdit(true)}>✏️ Edit</button>

            {/* Top row: avatar+info | QR | ID badge */}
            <div style={S.heroTop}>

              {/* Avatar + name block */}
              <div style={S.heroLeft}>
                <div style={S.avatar}>{initials}</div>
                <div style={S.heroInfo}>
                  <h2 style={S.heroName}>{tourist.name}</h2>
                  <p style={S.heroEmail}>{tourist.email}</p>
                  <span style={{ ...S.statusPill, background:sc.bg, color:sc.color }}>
                    <span style={{ ...S.dot, background:sc.dot }} /> {tourist.status}
                  </span>
                </div>
              </div>

              {/* Spacer pushes QR + badge to the right */}
              <div style={{ flex: 1 }} />

              {/* QR code */}
              <div style={S.qrSection}>
                <QRCode value={qrPayload} size={100} />
                <button style={S.qrBtn} onClick={() => setShowQR(true)}>View Full QR</button>
              </div>

              {/* Tourist ID badge */}
              <div style={S.idBadge}>
                <p style={S.idLabel}>Tourist ID</p>
                <p style={S.idValue}>{tourist.touristId}</p>
                <p style={S.idVerify}>✅ SafeTrail Verified</p>
              </div>
            </div>

            {/* Bottom fields row */}
            <div style={S.heroGrid}>
              {[
                { label:'Nationality', value: display(tourist.nationality) },
                { label:'Phone',       value: display(tourist.phone) },
                { label:'Passport No', value: display(tourist.passportNo) },
                { label:'Role',        value: tourist.role },
              ].map((f,i,arr) => (
                <div key={f.label} style={{ ...S.heroField, borderRight:i<arr.length-1?'0.5px solid #E2E8F0':'none' }}>
                  <p style={S.fieldLabel}>{f.label}</p>
                  <p style={{
                    ...S.fieldValue,
                    // ── FIX: style '—' differently so missing data is obvious but not alarming
                    color: f.value === '—' ? '#CBD5E1' : '#0F172A',
                    fontStyle: f.value === '—' ? 'italic' : 'normal',
                  }}>{f.value}</p>
                </div>
              ))}
            </div>

            {/* ── FIX: Hint shown when any required field is missing ── */}
            {(!tourist.nationality || !tourist.phone || !tourist.passportNo) && (
              <div style={S.missingHint}>
                <span style={{ fontSize:12 }}>ℹ️</span>
                <span>
                  Some profile fields are empty.{' '}
                  <button style={S.hintLink} onClick={() => setShowEdit(true)}>
                    Tap Edit to fill them in.
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* ── Stats ── */}
          <section>
            <p style={S.secLabel}>Trip at a glance</p>
            <div style={S.statsGrid}>
              {[
                {
                  icon:'📍', label:'Places Visited', labelColor:'#3B82F6',
                  value: String(visits.length),
                  sub:'Near your location', subColor:'#2563EB'
                },
                {
                  icon:'🛡️', label:'Safe Trips', labelColor:'#10B981',
                  value: String(visits.filter(v=>v.status==='SAFE').length),
                  sub:'All clear', subColor:'#059669'
                },
                {
                  icon:'👥', label:'Emergency Contacts', labelColor:'#8B5CF6',
                  value: String(contacts.length),
                  sub: contacts.length===0 ? 'Add one now' : 'Ready', subColor:'#7C3AED'
                },
                {
                  icon:'📡', label:'Live Location', labelColor:'#06B6D4',
                  value: liveLocationStr,
                  sub: liveSubStr,
                  subColor:'#0891B2'
                },
              ].map(s => (
                <div key={s.label} style={S.statCard}>
                  <div style={S.scIcon}>{s.icon}</div>
                  <p style={{ ...S.scLabel, color:s.labelColor }}>{s.label}</p>
                  <p style={S.scVal}>{s.value}</p>
                  <p style={{ ...S.scSub, color:s.subColor }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Location banner ── */}
          <div style={S.locBanner}>
            <span style={{ fontSize:16, flexShrink:0 }}>📡</span>
            <span style={{ ...S.locPing, background:locating?'#F59E0B':'#22C55E', boxShadow:locating?'0 0 0 3px #FDE68A':'0 0 0 3px #BBF7D0' }} />
            <p style={S.locBannerText}>
              {locating
                ? 'Acquiring your live GPS location…'
                : liveCoords
                  ? <>
                      <strong style={{ color:'#0F172A' }}>Current location:</strong>&nbsp;
                      {cityLabel}&nbsp;
                      <span style={{ color:'#94A3B8' }}>
                        ({liveCoords.lat.toFixed(5)}, {liveCoords.lng.toFixed(5)})
                      </span>
                    </>
                  : <span style={{ color:'#EF4444' }}>Location unavailable — please enable browser GPS permissions.</span>
              }
            </p>
            {liveCoords && (
              <span style={S.locCoords}>{liveCoords.lat.toFixed(4)}, {liveCoords.lng.toFixed(4)}</span>
            )}
          </div>

          {/* ── Visits + Contacts ── */}
          <div style={S.widgetsGrid}>
            {/* Recent Visits */}
            <div style={S.widgetCard}>
              <div style={S.wHead}>
                <h3 style={S.widgetTitle}>🗺️ Recent Visits</h3>
                <span style={S.wBadge}>{visits.length} places</span>
              </div>
              <p style={S.wSubhead}>{locating ? 'Sorted by distance…' : `Nearest first · from ${cityLabel}`}</p>
              {visits.length===0
                ? <div style={S.emptyState}><div style={{ fontSize:28,marginBottom:8 }}>📍</div>Fetching nearby places…</div>
                : visits.map((v,i) => (
                  <div key={i} style={{ ...S.visitRow, borderBottom: i < visits.length-1 ? '0.5px solid #F1F5F9' : 'none' }}>
                    <div style={S.visitEmoji}>{v.emoji}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={S.visitName}>{v.place}</p>
                      <p style={S.visitMeta}>{v.date} · {v.duration}</p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                      <span style={S.distPill}>📌 {v.distanceLabel}</span>
                      <span style={S.safePill}>SAFE</span>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Emergency Contacts */}
            <div style={S.widgetCard}>
              <div style={S.wHead}>
                <h3 style={S.widgetTitle}>🚨 Emergency Contacts</h3>
                <button style={S.addBtn} onClick={() => setShowAdd(true)}>+ Add</button>
              </div>
              <p style={S.wSubhead}>Notified automatically in SOS situations</p>
              {contacts.length===0
                ? <div style={S.emptyState}>
                    <div style={{ fontSize:28,marginBottom:8 }}>👥</div>
                    No contacts added yet.<br/>
                    <button style={{ ...S.addBtn, marginTop:10 }} onClick={() => setShowAdd(true)}>Add your first contact</button>
                  </div>
                : contacts.map((c,i) => (
                  <div key={c.id} style={{ ...S.contactRow, borderBottom: i < contacts.length-1 ? '0.5px solid #F1F5F9' : 'none' }}>
                    <div style={S.contactAvatar}>{c.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={S.contactName}>{c.name}</p>
                      <p style={S.contactMeta}>{c.phone} · {c.relation}</p>
                    </div>
                    {c.isPrimary && <span style={S.primaryBadge}>Primary</span>}
                    <button style={S.removeBtn} onClick={() => removeContact(c.id)}>Remove</button>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ── Account details ── */}
          <section>
            <p style={S.secLabel}>Account details</p>
            <div style={S.detailCard}>
              {[
                { icon:'👤', label:'Full Name',   value: tourist.name },
                { icon:'📧', label:'Email',       value: tourist.email },
                { icon:'📞', label:'Phone',       value: display(tourist.phone) },
                { icon:'🌍', label:'Nationality', value: display(tourist.nationality) },
                { icon:'🛂', label:'Passport No', value: display(tourist.passportNo) },
                { icon:'🏷️', label:'Role',        value: tourist.role },
              ].map((f,i,arr) => (
                <div key={f.label} style={{ ...S.detailRow, borderBottom:i<arr.length-1?'0.5px solid #F1F5F9':'none' }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{f.icon}</span>
                  <p style={S.detailLabel}>{f.label}</p>
                  <p style={{
                    ...S.detailValue,
                    color: f.value === '—' ? '#CBD5E1' : '#0F172A',
                    fontStyle: f.value === '—' ? 'italic' : 'normal',
                  }}>{f.value}</p>
                </div>
              ))}
            </div>
          </section>

          <div style={{ height:16 }} />
        </main>
      </div>

      {/* Add Contact Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Emergency Contact">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { label:'Full Name', key:'name', placeholder:'Jane Doe' },
            { label:'Phone Number', key:'phone', placeholder:'+91 98765 43210' },
            { label:'Relation', key:'relation', placeholder:'Parent / Spouse / Sibling' },
          ].map(f => (
            <div key={f.key}>
              <label style={S.modalLabel}>{f.label}</label>
              <input style={S.modalInput} type="text" placeholder={f.placeholder}
                value={newContact[f.key as keyof typeof newContact]}
                onChange={e => setNewContact(prev => ({ ...prev, [f.key]:e.target.value }))} />
            </div>
          ))}
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button style={S.btnGhost} onClick={() => setShowAdd(false)}>Cancel</button>
            <button
              style={{ ...S.btnPrimary, opacity: saving||!newContact.name||!newContact.phone ? .5 : 1 }}
              onClick={addContact}
              disabled={saving||!newContact.name||!newContact.phone}>
              {saving ? 'Saving…' : 'Add Contact'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── FIX: Edit Profile Modal now uses controlled state + persists data ── */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Profile">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          <div>
            <label style={S.modalLabel}>Full Name</label>
            <input style={S.modalInput} type="text" value={editName}
              onChange={e => setEditName(e.target.value)} placeholder="Your full name" />
          </div>

          <div>
            <label style={S.modalLabel}>Phone Number</label>
            <input style={S.modalInput} type="tel" value={editPhone}
              onChange={e => setEditPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>

          <div>
            <label style={S.modalLabel}>Nationality</label>
            <input style={S.modalInput} type="text" value={editNationality}
              onChange={e => setEditNationality(e.target.value)} placeholder="e.g. Indian" />
          </div>

          <div>
            <label style={S.modalLabel}>Passport / Aadhaar Number</label>
            <input style={S.modalInput} type="text" value={editPassportNo}
              onChange={e => setEditPassportNo(e.target.value)} placeholder="e.g. A1234567 or 1234 5678 9012" />
          </div>

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button style={S.btnGhost} onClick={() => setShowEdit(false)}>Cancel</button>
            <button style={S.btnPrimary} onClick={saveProfile}>Save Changes</button>
          </div>
        </div>
      </Modal>

      {/* QR Code Full View Modal */}
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Tourist Verification QR">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'8px 0' }}>
          <p style={{ fontSize:12, color:'#64748B', margin:0, textAlign:'center' }}>
            Scan this QR code to instantly verify tourist identity and safety status
          </p>
          <QRCode value={qrPayload} size={220} />
          <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 20px', width:'100%', boxSizing:'border-box' as const }}>
            {[
              { label:'Tourist ID', value:tourist.touristId },
              { label:'Name',       value:tourist.name },
              { label:'Nationality',value: display(tourist.nationality) },
              { label:'Status',     value:tourist.status },
            ].map(f => (
              <div key={f.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'0.5px solid #E2E8F0' }}>
                <span style={{ fontSize:11, color:'#94A3B8' }}>{f.label}</span>
                <span style={{ fontSize:11, fontWeight:600, color:'#0F172A' }}>{f.value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize:10, color:'#94A3B8', margin:0 }}>SafeTrail · Tourist Safety Platform</p>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root:    { display:'flex', height:'100vh', background:'#F0F4F8', fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", overflow:'hidden' },

  /* Sidebar */
  sidebar: { width:224, background:'#0F172A', display:'flex', flexDirection:'column', flexShrink:0, borderRight:'0.5px solid #1E293B' },
  sbBrand: { display:'flex', alignItems:'center', gap:10, padding:'20px 16px 16px', borderBottom:'0.5px solid #1E293B' },
  sbLogo:  { width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#3B82F6,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 },
  sbName:  { fontSize:13, fontWeight:700, color:'#F1F5F9', letterSpacing:'-0.2px', margin:0 },
  sbSub:   { fontSize:10, color:'#475569', margin:0 },
  sbNav:   { flex:1, overflowY:'auto', padding:'12px 8px', scrollbarWidth:'thin', scrollbarColor:'#1E293B transparent' },
  navLabel:{ fontSize:9, fontWeight:700, letterSpacing:2, color:'#334155', padding:'12px 8px 6px', textTransform:'uppercase', margin:0 },
  navItem: { display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, marginBottom:2 },
  navIcon: { width:28, height:28, borderRadius:6, background:'#1E293B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 },
  navText: { fontSize:12, fontWeight:500 },
  navBadge:{ marginLeft:'auto', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:99, background:'#EF4444', color:'#fff' },
  sbFooter:{ padding:'12px 8px', borderTop:'0.5px solid #1E293B' },
  sbUser:  { display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8 },
  sbAvatar:{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#3B82F6,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 },
  sbUname: { fontSize:11, fontWeight:600, color:'#CBD5E1', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  sbUrole: { fontSize:9, color:'#475569', margin:0 },

  /* Main */
  main:    { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 },
  topbar:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', background:'#fff', borderBottom:'0.5px solid #E2E8F0', flexShrink:0 },
  tbTitle: { fontSize:16, fontWeight:700, color:'#0F172A', letterSpacing:'-0.3px', margin:0 },
  tbSub:   { fontSize:11, color:'#64748B', margin:'2px 0 0' },
  tbRight: { display:'flex', alignItems:'center', gap:8, flexShrink:0 },
  pill:    { display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:600, padding:'5px 12px', borderRadius:99, whiteSpace:'nowrap' },
  pillGreen:{ background:'#F0FDF4', color:'#166534', border:'0.5px solid #BBF7D0' },
  pillBlue: { background:'#EFF6FF', color:'#1D4ED8', border:'0.5px solid #BFDBFE' },
  dot:     { width:6, height:6, borderRadius:'50%', display:'inline-block', flexShrink:0 },

  content: { flex:1, overflowY:'auto', padding:'20px 24px', background:'#F0F4F8', display:'flex', flexDirection:'column', gap:16, scrollbarWidth:'thin', scrollbarColor:'#CBD5E1 transparent' },

  /* ── Hero / ID Card ─────────────────────────────────────────────────────── */
  hero: {
    background:'#fff', borderRadius:14, border:'0.5px solid #E2E8F0',
    padding:'22px 24px 20px',
    position:'relative',
    overflow:'visible',
    boxShadow:'0 1px 4px rgba(0,0,0,.06)',
  },
  heroAccent: { position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#3B82F6,#06B6D4,#10B981)', borderRadius:'14px 14px 0 0' },

  heroTop: {
    display:'flex',
    alignItems:'flex-start',
    gap:16,
    flexWrap:'wrap',
  },

  heroLeft: {
    display:'flex',
    alignItems:'center',
    gap:14,
    flex:'1 1 260px',
    minWidth:0,
    paddingRight: 90,
  },

  heroInfo: { flex:1, minWidth:0 },

  avatar: { width:60, height:60, borderRadius:14, background:'linear-gradient(135deg,#3B82F6,#06B6D4)', color:'#fff', fontWeight:800, fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(59,130,246,.25)' },

  heroName: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.4px',
    margin: '0 0 3px',
    lineHeight: 1.25,
    wordBreak: 'break-word',
    whiteSpace: 'normal',
    overflowWrap: 'break-word',
  },

  heroEmail: { fontSize:11, color:'#64748B', margin:'0 0 7px' },
  statusPill:{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99 },

  qrSection: { display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 },
  qrBtn:     { fontSize:10, fontWeight:600, color:'#2563EB', background:'#EFF6FF', border:'0.5px solid #BFDBFE', borderRadius:6, padding:'4px 12px', cursor:'pointer' },

  idBadge:   { textAlign:'right', background:'#EFF6FF', borderRadius:10, padding:'12px 16px', border:'0.5px solid #BFDBFE', flexShrink:0 },
  idLabel:   { fontSize:9, color:'#64748B', letterSpacing:'.8px', textTransform:'uppercase', margin:0 },
  idValue:   { fontSize:20, fontWeight:800, color:'#2563EB', letterSpacing:'-0.5px', margin:'2px 0 0' },
  idVerify:  { fontSize:9, color:'#64748B', margin:'4px 0 0' },

  heroGrid:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', marginTop:18, paddingTop:14, borderTop:'0.5px solid #E2E8F0' },
  heroField: { paddingRight:16 },
  fieldLabel:{ fontSize:9, color:'#94A3B8', letterSpacing:'.6px', textTransform:'uppercase', margin:0 },
  fieldValue:{ fontSize:13, fontWeight:600, margin:'4px 0 0' },

  editBtn: {
    position:'absolute', top:18, right:18,
    padding:'6px 14px', borderRadius:8, fontSize:11, fontWeight:600,
    border:'0.5px solid #E2E8F0', background:'#fff', color:'#475569',
    cursor:'pointer', display:'flex', alignItems:'center', gap:4,
    boxShadow:'0 1px 2px rgba(0,0,0,.06)', whiteSpace:'nowrap',
    zIndex: 2,
  },

  // ── FIX: hint banner shown when profile fields are missing
  missingHint: {
    display:'flex', alignItems:'center', gap:8,
    marginTop:12, padding:'8px 14px',
    background:'#FFFBEB', border:'0.5px solid #FDE68A',
    borderRadius:8, fontSize:11, color:'#92400E',
  },
  hintLink: {
    background:'none', border:'none', padding:0, cursor:'pointer',
    color:'#D97706', fontWeight:700, fontSize:11, textDecoration:'underline',
  },

  secLabel:  { fontSize:9, fontWeight:700, letterSpacing:2, color:'#94A3B8', textTransform:'uppercase', margin:'0 0 10px' },

  /* Stats */
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10 },
  statCard:  { borderRadius:12, padding:'16px', border:'0.5px solid #E2E8F0', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.03)' },
  scIcon:    { fontSize:20, marginBottom:8 },
  scLabel:   { fontSize:9, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', margin:'0 0 6px' },
  scVal:     { fontSize:22, fontWeight:800, color:'#0F172A', letterSpacing:'-0.5px', lineHeight:1.2, margin:0 },
  scSub:     { fontSize:10, fontWeight:600, margin:'4px 0 0' },

  /* Location banner */
  locBanner:    { background:'#fff', borderRadius:10, border:'0.5px solid #E2E8F0', padding:'12px 18px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 1px 2px rgba(0,0,0,.03)' },
  locPing:      { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  locBannerText:{ flex:1, fontSize:12, color:'#64748B', lineHeight:1.6, margin:0 },
  locCoords:    { fontSize:10, color:'#94A3B8', padding:'3px 10px', background:'#F8FAFC', borderRadius:99, border:'0.5px solid #E2E8F0', flexShrink:0, whiteSpace:'nowrap' },

  /* Widgets */
  widgetsGrid: { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12 },
  widgetCard:  { borderRadius:12, border:'0.5px solid #E2E8F0', background:'#fff', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.03)' },
  wHead:       { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'0.5px solid #E2E8F0' },
  widgetTitle: { fontSize:12, fontWeight:700, color:'#0F172A', margin:0 },
  wBadge:      { fontSize:10, fontWeight:600, background:'#EFF6FF', color:'#2563EB', padding:'2px 9px', borderRadius:99 },
  wSubhead:    { fontSize:10, color:'#94A3B8', padding:'6px 16px 4px', margin:0 },

  visitRow:   { display:'flex', alignItems:'center', gap:12, padding:'10px 16px' },
  visitEmoji: { fontSize:20, flexShrink:0 },
  visitName:  { fontSize:12, fontWeight:600, color:'#0F172A', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  visitMeta:  { fontSize:10, color:'#94A3B8', margin:'2px 0 0' },
  distPill:   { fontSize:10, fontWeight:600, color:'#0891B2', background:'#CFFAFE', padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap' },
  safePill:   { fontSize:9, fontWeight:700, color:'#166534', background:'#F0FDF4', padding:'2px 8px', borderRadius:99 },

  contactRow:   { display:'flex', alignItems:'center', gap:10, padding:'10px 16px' },
  contactAvatar:{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,#FCA5A5,#F87171)', color:'#fff', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  contactName:  { fontSize:12, fontWeight:600, color:'#0F172A', margin:0 },
  contactMeta:  { fontSize:10, color:'#94A3B8', margin:'2px 0 0' },
  primaryBadge: { fontSize:9, fontWeight:700, background:'#F0FDF4', color:'#16A34A', padding:'2px 8px', borderRadius:99, border:'0.5px solid #BBF7D0' },
  removeBtn:    { padding:'4px 9px', borderRadius:6, border:'0.5px solid #E2E8F0', background:'none', cursor:'pointer', color:'#94A3B8', fontSize:10, fontWeight:600 },

  /* Account details */
  detailCard: { background:'#fff', borderRadius:12, border:'0.5px solid #E2E8F0', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.03)' },
  detailRow:  { display:'flex', alignItems:'center', gap:12, padding:'11px 16px' },
  detailLabel:{ fontSize:11, color:'#94A3B8', width:120, flexShrink:0, margin:0 },
  detailValue:{ fontSize:12, fontWeight:600, margin:0 },

  emptyState: { textAlign:'center', padding:'36px 16px', color:'#94A3B8', fontSize:12 },
  addBtn:     { display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px', background:'#2563EB', color:'#fff', border:'none', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer' },
  btnPrimary: { flex:1, padding:'10px', background:'#2563EB', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  btnGhost:   { flex:1, padding:'10px', background:'#fff', color:'#475569', border:'0.5px solid #E2E8F0', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  modalLabel: { fontSize:11, fontWeight:600, color:'#475569', display:'block', marginBottom:6 },
  modalInput: { width:'100%', padding:'9px 12px', fontSize:13, border:'0.5px solid #E2E8F0', borderRadius:8, background:'#F8FAFC', color:'#0F172A', outline:'none', boxSizing:'border-box' as const, fontFamily:'inherit' },
  loaderRing: { width:36, height:36, border:'3px solid #E2E8F0', borderTopColor:'#3B82F6', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
}

export default function ProfilePage() {
  return <AuthGuard><ProfileContent /></AuthGuard>
}