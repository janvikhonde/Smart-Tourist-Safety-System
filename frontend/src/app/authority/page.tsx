'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import { authorityApi } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useLocation } from '@/hooks/useLocation'
import { getUser } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import { Tourist } from '@/types'
import ToastContainer, { toast } from '@/components/shared/Toast'
import { timeAgo } from '@/lib/utils'

/* ─────────────── nav config ─────────────── */

const NAV_MAIN = [
  { href: '/dashboard/authority', icon: '🏠', label: 'Dashboard' },
  { href: '/tracking', icon: '📍', label: 'Live Tracking' },
  { href: '/emergency', icon: '🆘', label: 'Emergency', badge: '!' },
  { href: '/authority', icon: '👮', label: 'Authority Panel' },
]

const NAV_EXPLORE = [
  { href: '/weather', icon: '⛅', label: 'Weather' },
  { href: '/ai-assistant', icon: '🤖', label: 'AI Assistant' },
]

const NAV_ACCOUNT = [
  { href: '/profile', icon: '👤', label: 'My Profile' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
]

/* ─── Mock Data ─────────────────────────────────────────────────────────── */

const MOCK_TOURISTS: Tourist[] = [
  {
    id: 1,
    touristId: 'TRS-4821',
    user: {
      id: 1,
      name: 'Rahul Sharma',
      email: 'rahul@ex.com',
      role: 'TOURIST',
    },
    phone: '+91 9876543210',
    nationality: 'Indian',
    idProofType: 'AADHAAR',
    idProofNumber: 'XXXX-4821',
    currentLat: 20.5519,
    currentLng: 75.7033,
    status: 'ACTIVE',
    checkedInAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2,
    touristId: 'TRS-3912',
    user: {
      id: 2,
      name: 'Emma Johnson',
      email: 'emma@ex.com',
      role: 'TOURIST',
    },
    phone: '+44 7912345678',
    nationality: 'British',
    idProofType: 'PASSPORT',
    idProofNumber: 'XXXX-3912',
    currentLat: 19.9016,
    currentLng: 75.3236,
    status: 'ACTIVE',
    checkedInAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 3,
    touristId: 'TRS-6043',
    user: {
      id: 3,
      name: 'Yuki Tanaka',
      email: 'yuki@ex.com',
      role: 'TOURIST',
    },
    phone: '+81 9012345678',
    nationality: 'Japanese',
    idProofType: 'PASSPORT',
    idProofNumber: 'XXXX-6043',
    currentLat: 20.0269,
    currentLng: 75.178,
    status: 'EMERGENCY',
    checkedInAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 4,
    touristId: 'TRS-2256',
    user: {
      id: 4,
      name: 'Carlos Mendez',
      email: 'carlos@ex.com',
      role: 'TOURIST',
    },
    phone: '+52 5512345678',
    nationality: 'Mexican',
    idProofType: 'PASSPORT',
    idProofNumber: 'XXXX-2256',
    currentLat: 19.8762,
    currentLng: 75.3433,
    status: 'ACTIVE',
    checkedInAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 5,
    touristId: 'TRS-8831',
    user: {
      id: 5,
      name: 'Aisha Patel',
      email: 'aisha@ex.com',
      role: 'TOURIST',
    },
    phone: '+91 9123456789',
    nationality: 'Indian',
    idProofType: 'AADHAAR',
    idProofNumber: 'XXXX-8831',
    currentLat: null,
    currentLng: null,
    status: 'INACTIVE',
    checkedInAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
]

const MOCK_ALERTS = [
  {
    id: 1,
    title: 'Heavy crowd at Dharavi Sector',
    description:
      'Crowd density exceeded threshold. Immediate action recommended.',
    type: 'CROWD',
    priority: 'HIGH',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
  },
  {
    id: 2,
    title: 'Weather advisory – Coastal Zone B',
    description:
      'Strong winds expected. Tourists advised to avoid open areas.',
    type: 'WEATHER',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 3,
    title: 'Signal loss – TRS-8831',
    description:
      'Tourist Aisha Patel has not been reachable for 30+ minutes.',
    type: 'SIGNAL',
    priority: 'HIGH',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 4,
    title: 'Zone 2 capacity warning',
    description: 'Ellora Caves approaching 90% capacity.',
    type: 'CAPACITY',
    priority: 'LOW',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
]

const MOCK_ZONES = [
  {
    id: 1,
    name: 'Gateway of India',
    status: 'SAFE' as const,
    touristCount: 68,
    capacity: 100,
    radiusMeters: 500,
  },
  {
    id: 2,
    name: 'Dharavi Tour Zone',
    status: 'DANGER' as const,
    touristCount: 94,
    capacity: 100,
    radiusMeters: 400,
  },
  {
    id: 3,
    name: 'Marine Drive',
    status: 'WARNING' as const,
    touristCount: 82,
    capacity: 100,
    radiusMeters: 800,
  },
  {
    id: 4,
    name: 'Juhu Beach',
    status: 'SAFE' as const,
    touristCount: 55,
    capacity: 100,
    radiusMeters: 600,
  },
  {
    id: 5,
    name: 'Elephanta Caves',
    status: 'SAFE' as const,
    touristCount: 41,
    capacity: 100,
    radiusMeters: 700,
  },
  {
    id: 6,
    name: 'Sanjay Gandhi NP',
    status: 'WARNING' as const,
    touristCount: 77,
    capacity: 100,
    radiusMeters: 1200,
  },
]

const BROADCAST_HISTORY = [
  {
    id: 1,
    message: 'Please avoid the northern trail due to maintenance work.',
    type: 'Info',
    sentAt: new Date(Date.now() - 31 * 60000).toISOString(),
    audience: 'All Tourists',
    sentTo: 8,
  },
  {
    id: 2,
    message: 'Heavy rain expected in the next 2 hours. Seek shelter.',
    type: 'Warning',
    sentAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    audience: 'Zone 3',
    sentTo: 23,
  },
  {
    id: 3,
    message: 'Emergency drill in progress. Follow guide instructions.',
    type: 'Emergency',
    sentAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    audience: 'All Tourists',
    sentTo: 8,
  },
]

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]

  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>

    for (const key of ['data', 'content', 'tourists', 'items']) {
      if (Array.isArray(d[key])) return d[key] as T[]
    }
  }

  return []
}

function genTrsId() {
  return 'TRS-' + Math.floor(1000 + Math.random() * 9000)
}

type Tab = 'tourists' | 'alerts' | 'zones' | 'broadcast'

type AlertRow = (typeof MOCK_ALERTS)[0]
type ZoneRow = (typeof MOCK_ZONES)[0]
type BroadcastRow = (typeof BROADCAST_HISTORY)[0]

const ZONE_COLOR: Record<string, string> = {
  SAFE: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
}

const STATUS_STYLE: Record<
  string,
  { bg: string; color: string; border: string; dot: string }
> = {
  ACTIVE: {
    bg: '#F0FDF4',
    color: '#166534',
    border: '#BBF7D0',
    dot: '#10B981',
  },
  INACTIVE: {
    bg: '#F8FAFC',
    color: '#64748B',
    border: '#E2E8F0',
    dot: '#94A3B8',
  },
  EMERGENCY: {
    bg: '#FEF2F2',
    color: '#EF4444',
    border: '#FECACA',
    dot: '#EF4444',
  },
}

const PRIORITY_STYLE: Record<
  string,
  { color: string; border: string }
> = {
  HIGH: {
    color: '#EF4444',
    border: '#FECACA',
  },
  MEDIUM: {
    color: '#F59E0B',
    border: '#FDE68A',
  },
  LOW: {
    color: '#94A3B8',
    border: '#E2E8F0',
  },
}

const BROADCAST_COLOR: Record<string, string> = {
  Info: '#3B82F6',
  Warning: '#F59E0B',
  Emergency: '#EF4444',
  Weather: '#8B5CF6',
}

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */

function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = getUser()

  const initials = (user?.name ?? 'AU')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  type NavItem = {
    href: string
    icon: string
    label: string
    badge?: string
  }

  const NavGroup = ({
    label,
    items,
  }: {
    label: string
    items: NavItem[]
  }) => (
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
                ? 'linear-gradient(90deg,#7C3AED,#6D28D9)'
                : 'transparent',
              boxShadow: active
                ? '0 2px 8px rgba(124,58,237,0.25)'
                : 'none',
              cursor: 'pointer',
            }}
            role="link"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === 'Enter' && router.push(item.href)
            }
          >
            <span
              style={{
                ...S.navIcon,
                background: active
                  ? 'rgba(255,255,255,0.15)'
                  : '#1E293B',
              }}
            >
              {item.icon}
            </span>

            <span
              style={{
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                color: active ? '#fff' : '#94A3B8',
                fontFamily: FONT,
              }}
            >
              {item.label}
            </span>

            {item.badge && (
              <span style={S.navBadge}>{item.badge}</span>
            )}

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
        <NavGroup label="Main" items={NAV_MAIN} />
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
            <p style={S.sbUname}>
              {user?.name ?? 'Authority'}
            </p>

            <p style={S.sbUrole}>
              Authority · Active
            </p>
          </div>

          <span style={S.sbOnlineDot} />
        </div>
      </div>
    </aside>
  )
}

/* ════════════════════════════════════════
   MAIN CONTENT
════════════════════════════════════════ */

function AuthorityContent() {
  useWebSocket(true)
  useLocation(true)

  const [tab, setTab] = useState<Tab>('tourists')
  const [time, setTime] = useState('')
  const [tourists, setTourists] =
    useState<Tourist[]>(MOCK_TOURISTS)
  const [alerts, setAlerts] =
    useState<AlertRow[]>(MOCK_ALERTS)
  const [zones, setZones] =
    useState<ZoneRow[]>(MOCK_ZONES)
  const [broadcastHistory, setBH] =
    useState<BroadcastRow[]>(BROADCAST_HISTORY)
  const [expandedId, setExpanded] =
    useState<number | null>(null)

  /* search / filter */

  const [search, setSearch] = useState('')
  const [filterStatus, setFS] = useState('ALL')

  /* add tourist */

  const [addOpen, setAddOpen] = useState(false)

  const [newTourist, setNewTourist] = useState({
    name: '',
    email: '',
    phone: '',
    nationality: '',
    idProofType: 'PASSPORT',
    idProofNumber: '',
  })

  /* add alert */

  const [addAlertOpen, setAddAlertOpen] =
    useState(false)

  const [newAlert, setNewAlert] = useState({
    title: '',
    description: '',
    type: 'CROWD',
    priority: 'HIGH',
  })

  /* add zone */

  const [addZoneOpen, setAddZoneOpen] =
    useState(false)

  const [newZone, setNewZone] = useState({
    name: '',
    status: 'SAFE' as 'SAFE' | 'WARNING' | 'DANGER',
    radiusMeters: 500,
  })

  /* broadcast */

  const [broadcastMsg, setBroadcastMsg] =
    useState('')

  const [broadcastType, setBType] =
    useState('Info')

  const [broadcastAudience, setBAudience] =
    useState('All Tourists')

  const [sending, setSending] =
    useState(false)

  /* clock */

  useEffect(() => {
    const tick = () => {
      const now = new Date()

      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
    }

    tick()

    const id = setInterval(tick, 1000)

    return () => clearInterval(id)
  }, [])

  /* fetch tourists from API */

  useEffect(() => {
    authorityApi
      .getAllTourists()
      .then((r) => {
        const l = toArray<Tourist>(r.data)

        if (l.length) {
          setTourists(l)
        }
      })
      .catch(() => {})
  }, [])

  /* derived */

  const filteredTourists = tourists.filter((t) => {
    const q = search.toLowerCase()

    const matchSearch =
      !q ||
      [
        t.user?.name,
        t.touristId,
        t.phone,
        t.nationality,
      ].some((v) =>
        v?.toLowerCase().includes(q)
      )

    return (
      matchSearch &&
      (filterStatus === 'ALL' ||
        t.status === filterStatus)
    )
  })

  const activeAlerts =
    alerts.filter((a) => a.status === 'ACTIVE').length

  const sosCount =
    tourists.filter(
      (t) => t.status === 'EMERGENCY'
    ).length

  /* handlers */

  const handleAddTourist = () => {
    if (!newTourist.name || !newTourist.phone) {
      toast.error('Name and phone are required.')
      return
    }

    const t: Tourist = {
      id: Date.now(),

      touristId: genTrsId(),

      user: {
        id: Date.now(),
        name: newTourist.name,
        email: newTourist.email,
        role: 'TOURIST',
      },

      phone: newTourist.phone,

      nationality:
        newTourist.nationality || 'Unknown',

      idProofType:
        newTourist.idProofType as any,

      idProofNumber:
        newTourist.idProofNumber,

      currentLat: null,
      currentLng: null,

      status: 'ACTIVE',

      checkedInAt:
        new Date().toISOString(),
    }

    setTourists((prev) => [
      t,
      ...prev,
    ])

    setAddOpen(false)

    setNewTourist({
      name: '',
      email: '',
      phone: '',
      nationality: '',
      idProofType: 'PASSPORT',
      idProofNumber: '',
    })

    toast.success(
      `Tourist ${t.touristId} registered!`
    )
  }

  const handleAddAlert = () => {
    if (!newAlert.title) {
      toast.error('Title is required.')
      return
    }

    const a: AlertRow = {
      id: Date.now(),
      title: newAlert.title,
      description: newAlert.description,
      type: newAlert.type,
      priority: newAlert.priority,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    }

    setAlerts((prev) => [
      a,
      ...prev,
    ])

    setAddAlertOpen(false)

    setNewAlert({
      title: '',
      description: '',
      type: 'CROWD',
      priority: 'HIGH',
    })

    toast.success('Alert created.')
  }

  const handleAddZone = () => {
    if (!newZone.name) {
      toast.error('Zone name required.')
      return
    }

    const z: ZoneRow = {
      id: Date.now(),
      name: newZone.name,
      status: newZone.status,
      touristCount: 0,
      capacity: 100,
      radiusMeters: newZone.radiusMeters,
    }

    setZones((prev) => [
      ...prev,
      z,
    ])

    setAddZoneOpen(false)

    setNewZone({
      name: '',
      status: 'SAFE',
      radiusMeters: 500,
    })

    toast.success(
      `Zone "${z.name}" added.`
    )
  }

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return

    setSending(true)

    try {
      await authorityApi.broadcast({
        message: broadcastMsg,
        priority: broadcastType.toUpperCase(),
      })
    } catch {}

    const entry: BroadcastRow = {
      id: Date.now(),
      message: broadcastMsg,
      type: broadcastType,
      sentAt: new Date().toISOString(),
      audience: broadcastAudience,
      sentTo: tourists.filter(
        (t) => t.status === 'ACTIVE'
      ).length,
    }

    setBH((prev) => [
      entry,
      ...prev,
    ])

    setSending(false)
    setBroadcastMsg('')

    toast.success(
      `Broadcast sent to ${entry.sentTo} tourists!`
    )
  }

  const TABS = [
    {
      id: 'tourists' as Tab,
      icon: '👥',
      label: 'Tourists',
      count: tourists.length,
    },
    {
      id: 'alerts' as Tab,
      icon: '🚨',
      label: 'Alerts',
      count: activeAlerts,
    },
    {
      id: 'zones' as Tab,
      icon: '🛡️',
      label: 'Zones',
      count: zones.length,
    },
    {
      id: 'broadcast' as Tab,
      icon: '📢',
      label: 'Broadcast',
    },
  ]

  /* ────────────────────────────────────────────────────────────────────── */

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>

        {/* ── Topbar ── */}

        <div style={S.topbar}>
          <div>
            <h1 style={S.tbTitle}>
              Authority Panel
            </h1>

            <p style={S.tbSub}>
              Tourist Registry · Alerts · Zone Control — Nanded, Maharashtra
            </p>
          </div>

          <div style={S.tbRight}>
            <span style={S.tbTime}>
              {time}
            </span>

            <span
              style={{
                ...S.pill,
                ...S.pillPurple,
              }}
            >
              <span
                style={{
                  ...S.dot,
                  background: '#A855F7',
                }}
              />

              Authority Access
            </span>

            <span
              style={{
                ...S.pill,
                ...S.pillGreen,
              }}
            >
              <span
                style={{
                  ...S.dot,
                  background: '#22C55E',
                }}
              />

              System Online
            </span>
          </div>
        </div>

        <main style={S.content}>

          {/* ── Stat Cards ── */}

          <section>
            <p style={S.secLabel}>
              System at a glance
            </p>

            <div style={S.statsGrid}>
              {[
                {
                  icon: '👥',
                  label: 'Total Tourists',
                  labelColor: '#6366F1',
                  value: String(tourists.length),
                  sub: `${
                    tourists.filter(
                      (t) => t.status === 'ACTIVE'
                    ).length
                  } active`,
                  subColor: '#10B981',
                },
                {
                  icon: '⚠️',
                  label: 'Active Alerts',
                  labelColor: '#F59E0B',
                  value: String(activeAlerts),
                  sub: 'Needs attention',
                  subColor:
                    activeAlerts > 0
                      ? '#EF4444'
                      : '#10B981',
                },
                {
                  icon: '🆘',
                  label: 'In Emergency',
                  labelColor: '#EF4444',
                  value: String(sosCount),
                  sub:
                    sosCount > 0
                      ? 'SOS active!'
                      : 'No active SOS',
                  subColor:
                    sosCount > 0
                      ? '#EF4444'
                      : '#10B981',
                },
                {
                  icon: '🛡️',
                  label: 'Safe Zones',
                  labelColor: '#10B981',
                  value: String(
                    zones.filter(
                      (z) => z.status === 'SAFE'
                    ).length
                  ),
                  sub: 'All monitored',
                  subColor: '#059669',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={S.statCard}
                >
                  <div style={S.scIcon}>
                    {s.icon}
                  </div>

                  <p
                    style={{
                      ...S.scLabel,
                      color: s.labelColor,
                    }}
                  >
                    {s.label}
                  </p>

                  <p
                    style={{
                      ...S.scVal,
                      fontSize:
                        s.value.length > 4
                          ? 17
                          : 28,
                    }}
                  >
                    {s.value}
                  </p>

                  <p
                    style={{
                      ...S.scSub,
                      color: s.subColor,
                    }}
                  >
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tabs ── */}

          <div style={S.tabRow}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  ...S.tab,
                  background:
                    tab === t.id
                      ? 'linear-gradient(90deg,#7C3AED,#6D28D9)'
                      : 'transparent',
                  color:
                    tab === t.id
                      ? '#fff'
                      : '#64748B',
                  border:
                    tab === t.id
                      ? 'none'
                      : '1px solid #E8EDF2',
                  boxShadow:
                    tab === t.id
                      ? '0 2px 8px rgba(124,58,237,0.2)'
                      : 'none',
                }}
              >
                {t.icon} {t.label}

                {t.count !== undefined &&
                  t.count > 0 && (
                    <span
                      style={{
                        ...S.tabBadge,
                        background:
                          tab === t.id
                            ? 'rgba(255,255,255,0.2)'
                            : '#7C3AED',
                      }}
                    >
                      {t.count}
                    </span>
                  )}
              </button>
            ))}
          </div>

          {/* ══ TAB: TOURISTS ══ */}

          {tab === 'tourists' && (
            <section style={S.card}>

              {/* Search + Filter + Add */}

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                }}
              >
                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by name, ID, phone, nationality…"
                  style={S.input}
                />

                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFS(e.target.value)
                  }
                  style={S.select}
                >
                  {[
                    'ALL',
                    'ACTIVE',
                    'INACTIVE',
                    'EMERGENCY',
                  ].map((s) => (
                    <option key={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    setAddOpen(true)
                  }
                  style={S.primaryBtn}
                >
                  + Add Tourist
                </button>
              </div>

              {/* Table */}

              <div
                style={{
                  overflowX: 'auto',
                }}
              >
                {filteredTourists.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      padding: '32px 0',
                      color: '#94A3B8',
                      fontSize: 13,
                      fontFamily: FONT,
                    }}
                  >
                    No tourists found.
                  </p>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {[
                          'Tourist ID',
                          'Name',
                          'Nationality',
                          'Phone',
                          'Location',
                          'Status',
                          'Checked In',
                          '',
                        ].map((h) => (
                          <th
                            key={h}
                            style={S.th}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTourists.map(
                        (t, i) => {
                          const ss =
                            STATUS_STYLE[
                              t.status
                            ] ??
                            STATUS_STYLE.INACTIVE

                          const isExpanded =
                            expandedId === t.id

                          return (
                            <>
                              <tr
                                key={t.id}
                                style={{
                                  background:
                                    i % 2 === 0
                                      ? 'transparent'
                                      : '#FAFBFC',
                                  cursor:
                                    'pointer',
                                }}
                                onClick={() =>
                                  setExpanded(
                                    isExpanded
                                      ? null
                                      : t.id
                                  )
                                }
                              >
                                <td
                                  style={{
                                    ...S.td,
                                    color: '#7C3AED',
                                    fontWeight: 600,
                                  }}
                                >
                                  {t.touristId}
                                </td>

                                <td
                                  style={{
                                    ...S.td,
                                    fontWeight: 600,
                                    color: '#0F172A',
                                  }}
                                >
                                  {t.user?.name ??
                                    '—'}
                                </td>

                                <td style={S.td}>
                                  {t.nationality}
                                </td>

                                <td style={S.td}>
                                  {t.phone}
                                </td>

                                <td
                                  style={{
                                    ...S.td,
                                    fontFamily:
                                      'monospace',
                                    fontSize: 10,
                                  }}
                                >
                                  {t.currentLat
                                    ? `${t.currentLat.toFixed(
                                        3
                                      )}, ${t.currentLng!.toFixed(
                                        3
                                      )}`
                                    : '—'}
                                </td>

                                <td style={S.td}>
                                  <span
                                    style={{
                                      ...S.statusBadge,
                                      background:
                                        ss.bg,
                                      color:
                                        ss.color,
                                      borderColor:
                                        ss.border,
                                    }}
                                  >
                                    <span
                                      style={{
                                        ...S.dot,
                                        width: 5,
                                        height: 5,
                                        background:
                                          ss.dot,
                                      }}
                                    />

                                    {t.status}
                                  </span>
                                </td>

                                {/* FIXED TYPESCRIPT ERROR */}

                                <td
                                  style={{
                                    ...S.td,
                                    color: '#94A3B8',
                                  }}
                                >
                                  {t.checkedInAt
                                    ? timeAgo(
                                        t.checkedInAt
                                      )
                                    : '—'}
                                </td>

                                <td
                                  style={{
                                    ...S.td,
                                    color: '#94A3B8',
                                    fontSize: 10,
                                  }}
                                >
                                  {isExpanded
                                    ? '▲'
                                    : '▼'}
                                </td>
                              </tr>

                              {/* Expanded detail */}

                              {isExpanded && (
                                <tr
                                  key={`${t.id}-detail`}
                                >
                                  <td
                                    colSpan={8}
                                    style={{
                                      padding:
                                        '0 12px 12px',
                                    }}
                                  >
                                    <div
                                      style={
                                        S.expandPanel
                                      }
                                    >
                                      <div
                                        style={{
                                          display:
                                            'grid',
                                          gridTemplateColumns:
                                            'repeat(4,minmax(0,1fr))',
                                          gap: 16,
                                          marginBottom:
                                            14,
                                        }}
                                      >
                                        {[
                                          {
                                            label:
                                              'Email',
                                            value:
                                              t.user
                                                ?.email ??
                                              '—',
                                          },
                                          {
                                            label:
                                              'ID Proof',
                                            value: `${t.idProofType}: ${t.idProofNumber}`,
                                          },
                                          {
                                            label:
                                              'Checked In',
                                            value:
                                              t.checkedInAt
                                                ? new Date(
                                                    t.checkedInAt
                                                  ).toLocaleString()
                                                : '—',
                                          },
                                          {
                                            label:
                                              'Coordinates',
                                            value:
                                              t.currentLat
                                                ? `${t.currentLat}, ${t.currentLng}`
                                                : 'No signal',
                                          },
                                        ].map(
                                          (f) => (
                                            <div
                                              key={
                                                f.label
                                              }
                                            >
                                              <p
                                                style={{
                                                  fontSize: 9,
                                                  color:
                                                    '#94A3B8',
                                                  textTransform:
                                                    'uppercase',
                                                  letterSpacing:
                                                    '1.5px',
                                                  margin:
                                                    '0 0 3px',
                                                  fontFamily:
                                                    FONT,
                                                }}
                                              >
                                                {
                                                  f.label
                                                }
                                              </p>

                                              <p
                                                style={{
                                                  fontSize: 11,
                                                  color:
                                                    '#0F172A',
                                                  fontWeight: 500,
                                                  margin: 0,
                                                  fontFamily:
                                                    FONT,
                                                }}
                                              >
                                                {
                                                  f.value
                                                }
                                              </p>
                                            </div>
                                          )
                                        )}
                                      </div>

                                      <div
                                        style={{
                                          display:
                                            'flex',
                                          gap: 8,
                                          flexWrap:
                                            'wrap',
                                        }}
                                      >
                                        {[
                                          {
                                            label:
                                              '✉️ Send Message',
                                            bg: '#EFF6FF',
                                            color:
                                              '#2563EB',
                                            border:
                                              '#BFDBFE',
                                            fn: () =>
                                              toast.success(
                                                `Message sent to ${t.user?.name}.`
                                              ),
                                          },
                                          {
                                            label:
                                              '🆘 Mark SOS',
                                            bg: '#FEF2F2',
                                            color:
                                              '#EF4444',
                                            border:
                                              '#FECACA',
                                            fn: () => {
                                              setTourists(
                                                (p) =>
                                                  p.map(
                                                    (x) =>
                                                      x.id ===
                                                      t.id
                                                        ? {
                                                            ...x,
                                                            status:
                                                              'EMERGENCY',
                                                          }
                                                        : x
                                                  )
                                              )

                                              toast.error(
                                                'SOS marked!'
                                              )

                                              setExpanded(
                                                null
                                              )
                                            },
                                          },
                                          {
                                            label:
                                              '⛔ Mark Inactive',
                                            bg: '#F8FAFC',
                                            color:
                                              '#64748B',
                                            border:
                                              '#E2E8F0',
                                            fn: () => {
                                              setTourists(
                                                (p) =>
                                                  p.map(
                                                    (x) =>
                                                      x.id ===
                                                      t.id
                                                        ? {
                                                            ...x,
                                                            status:
                                                              'INACTIVE',
                                                          }
                                                        : x
                                                  )
                                              )

                                              toast.success(
                                                'Marked inactive.'
                                              )

                                              setExpanded(
                                                null
                                              )
                                            },
                                          },
                                          {
                                            label:
                                              '🗑️ Remove',
                                            bg: '#FFF1F2',
                                            color:
                                              '#BE123C',
                                            border:
                                              '#FECDD3',
                                            fn: () => {
                                              setTourists(
                                                (p) =>
                                                  p.filter(
                                                    (x) =>
                                                      x.id !==
                                                      t.id
                                                  )
                                              )

                                              toast.success(
                                                'Tourist removed.'
                                              )

                                              setExpanded(
                                                null
                                              )
                                            },
                                          },
                                        ].map(
                                          (btn) => (
                                            <button
                                              key={
                                                btn.label
                                              }
                                              onClick={
                                                btn.fn
                                              }
                                              style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                padding:
                                                  '5px 12px',
                                                borderRadius: 7,
                                                background:
                                                  btn.bg,
                                                color:
                                                  btn.color,
                                                border: `0.5px solid ${btn.border}`,
                                                cursor:
                                                  'pointer',
                                                fontFamily:
                                                  FONT,
                                              }}
                                            >
                                              {
                                                btn.label
                                              }
                                            </button>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          )
                        }
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* ══ TAB: ALERTS ══ */}

          {tab === 'alerts' && (
            <section style={S.card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0F172A',
                    margin: 0,
                    fontFamily: FONT,
                  }}
                >
                  🚨 Active Alerts
                </h3>

                <button
                  onClick={() =>
                    setAddAlertOpen(true)
                  }
                  style={{
                    ...S.primaryBtn,
                    background:
                      'linear-gradient(90deg,#EF4444,#DC2626)',
                  }}
                >
                  + New Alert
                </button>
              </div>

              {alerts.length === 0 ? (
                <p
                  style={{
                    textAlign: 'center',
                    padding: '32px 0',
                    color: '#10B981',
                    fontSize: 13,
                    fontFamily: FONT,
                  }}
                >
                  ✅ No active alerts
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {alerts.map((a) => {
                    const ps =
                      PRIORITY_STYLE[
                        a.priority
                      ] ??
                      PRIORITY_STYLE.LOW

                    return (
                      <div
                        key={a.id}
                        style={{
                          ...S.alertRow,
                          opacity:
                            a.status ===
                            'RESOLVED'
                              ? 0.55
                              : 1,
                        }}
                      >
                        <div
                          style={{
                            ...S.alertIcon,
                            background:
                              a.type ===
                              'CROWD'
                                ? '#FEE2E2'
                                : a.type ===
                                    'WEATHER'
                                  ? '#EDE9FE'
                                  : '#FEF3C7',
                          }}
                        >
                          {a.type ===
                          'CROWD'
                            ? '🚨'
                            : a.type ===
                                'WEATHER'
                              ? '⛈️'
                              : a.type ===
                                  'SIGNAL'
                                ? '📡'
                                : '⚠️'}
                        </div>

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems:
                                'center',
                              gap: 8,
                              marginBottom: 2,
                            }}
                          >
                            <p
                              style={
                                S.alertTitle
                              }
                            >
                              {a.title}
                            </p>

                            {a.status ===
                              'RESOLVED' && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding:
                                    '2px 7px',
                                  borderRadius: 99,
                                  background:
                                    '#F1F5F9',
                                  color:
                                    '#64748B',
                                  fontFamily:
                                    FONT,
                                }}
                              >
                                RESOLVED
                              </span>
                            )}
                          </div>

                          <p
                            style={
                              S.alertDesc
                            }
                          >
                            {a.description}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              gap: 6,
                              marginTop: 5,
                            }}
                          >
                            <span
                              style={{
                                ...S.badge,
                                color:
                                  ps.color,
                                borderColor:
                                  ps.border,
                              }}
                            >
                              {a.priority}
                            </span>

                            <span
                              style={{
                                fontSize: 9,
                                color:
                                  '#94A3B8',
                                fontFamily:
                                  FONT,
                              }}
                            >
                              {timeAgo(
                                a.createdAt
                              )}
                            </span>
                          </div>
                        </div>

                        {a.status ===
                          'ACTIVE' && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 6,
                              flexShrink: 0,
                            }}
                          >
                            <button
                              onClick={() => {
                                setAlerts(
                                  (p) =>
                                    p.map(
                                      (x) =>
                                        x.id ===
                                        a.id
                                          ? {
                                              ...x,
                                              status:
                                                'RESOLVED',
                                            }
                                          : x
                                    )
                                )

                                toast.success(
                                  'Alert resolved.'
                                )
                              }}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding:
                                  '5px 11px',
                                borderRadius: 7,
                                background:
                                  '#F0FDF4',
                                color:
                                  '#166534',
                                border:
                                  '0.5px solid #BBF7D0',
                                cursor:
                                  'pointer',
                                fontFamily:
                                  FONT,
                              }}
                            >
                              ✓ Resolve
                            </button>

                            <button
                              onClick={() => {
                                setAlerts(
                                  (p) =>
                                    p.filter(
                                      (x) =>
                                        x.id !==
                                        a.id
                                    )
                                )

                                toast.success(
                                  'Alert dismissed.'
                                )
                              }}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding:
                                  '5px 11px',
                                borderRadius: 7,
                                background:
                                  '#F8FAFC',
                                color:
                                  '#64748B',
                                border:
                                  '0.5px solid #E2E8F0',
                                cursor:
                                  'pointer',
                                fontFamily:
                                  FONT,
                              }}
                            >
                              ✕ Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* ══ TAB: ZONES ══ */}

          {tab === 'zones' && (
            <section>
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <p style={S.secLabel}>
                  Zone overview
                </p>

                <button
                  onClick={() =>
                    setAddZoneOpen(true)
                  }
                  style={{
                    ...S.primaryBtn,
                    background:
                      'transparent',
                    color: '#7C3AED',
                    border:
                      '1px solid #E9D5FF',
                  }}
                >
                  + Add Zone
                </button>
              </div>

              <div style={S.zoneGrid}>
                {zones.map((z) => {
                  const c =
                    ZONE_COLOR[z.status]

                  return (
                    <div
                      key={z.id}
                      style={{
                        ...S.zoneCard,
                        borderColor: `${c}30`,
                      }}
                    >
                      <div style={S.zoneTop}>
                        <h3
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#0F172A',
                            margin: 0,
                            fontFamily: FONT,
                          }}
                        >
                          {z.name}
                        </h3>

                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 99,
                            background: `${c}15`,
                            color: c,
                            border: `0.5px solid ${c}40`,
                            fontFamily: FONT,
                          }}
                        >
                          {z.status}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '1fr 1fr',
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: 9,
                              color: '#94A3B8',
                              margin:
                                '0 0 3px',
                              fontFamily:
                                FONT,
                            }}
                          >
                            Tourists
                          </p>

                          <p
                            style={{
                              fontSize: 18,
                              fontWeight: 800,
                              color: '#0F172A',
                              margin: 0,
                              fontFamily:
                                FONT,
                            }}
                          >
                            👥 {z.touristCount}
                          </p>
                        </div>

                        <div>
                          <p
                            style={{
                              fontSize: 9,
                              color: '#94A3B8',
                              margin:
                                '0 0 3px',
                              fontFamily:
                                FONT,
                            }}
                          >
                            Radius
                          </p>

                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#334155',
                              margin: 0,
                              fontFamily:
                                FONT,
                            }}
                          >
                            ⭕ {z.radiusMeters}m
                          </p>
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            marginBottom: 5,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              color: '#94A3B8',
                              fontFamily:
                                FONT,
                            }}
                          >
                            Capacity
                          </span>

                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: c,
                              fontFamily:
                                FONT,
                            }}
                          >
                            {z.touristCount}%
                          </span>
                        </div>

                        <div
                          style={{
                            height: 5,
                            borderRadius: 99,
                            background:
                              '#EEF2F7',
                            overflow:
                              'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 99,
                              width: `${z.touristCount}%`,
                              background: c,
                              transition:
                                'width 0.6s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ══ TAB: BROADCAST ══ */}

          {tab === 'broadcast' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 16,
              }}
            >

              {/* Compose */}

              <section style={S.card}>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0F172A',
                    margin:
                      '0 0 4px',
                    fontFamily: FONT,
                  }}
                >
                  📢 Send Broadcast
                </h2>

                <p
                  style={{
                    fontSize: 11,
                    color: '#64748B',
                    margin:
                      '0 0 18px',
                    fontFamily: FONT,
                  }}
                >
                  Message all active tourists instantly.
                </p>

                <p style={S.fieldLabel}>
                  Message Type
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 14,
                  }}
                >
                  {[
                    'Info',
                    'Warning',
                    'Emergency',
                    'Weather',
                  ].map((type) => {
                    const c =
                      BROADCAST_COLOR[type]

                    const active =
                      broadcastType === type

                    return (
                      <button
                        key={type}
                        onClick={() =>
                          setBType(type)
                        }
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding:
                            '5px 13px',
                          borderRadius: 8,
                          background: active
                            ? `${c}15`
                            : 'transparent',
                          color: active
                            ? c
                            : '#64748B',
                          border: `0.5px solid ${
                            active
                              ? c + '50'
                              : '#E2E8F0'
                          }`,
                          cursor: 'pointer',
                          fontFamily: FONT,
                        }}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>

                <p style={S.fieldLabel}>
                  Target Audience
                </p>

                <select
                  value={broadcastAudience}
                  onChange={(e) =>
                    setBAudience(
                      e.target.value
                    )
                  }
                  style={{
                    ...S.select,
                    width: '100%',
                    marginBottom: 14,
                  }}
                >
                  {[
                    'All Tourists',
                    'Zone 1',
                    'Zone 2',
                    'Zone 3',
                    'Active Only',
                    'Emergency Only',
                  ].map((o) => (
                    <option key={o}>
                      {o}
                    </option>
                  ))}
                </select>

                <p style={S.fieldLabel}>
                  Message
                </p>

                <textarea
                  value={broadcastMsg}
                  onChange={(e) =>
                    setBroadcastMsg(
                      e.target.value
                    )
                  }
                  placeholder="Type your broadcast message here…"
                  rows={4}
                  style={{
                    ...S.input,
                    width: '100%',
                    resize:
                      'vertical',
                    marginBottom: 14,
                    boxSizing:
                      'border-box' as const,
                  }}
                />

                <button
                  onClick={sendBroadcast}
                  disabled={
                    sending ||
                    !broadcastMsg.trim()
                  }
                  style={{
                    ...S.primaryBtn,
                    width: '100%',
                    justifyContent:
                      'center',
                    opacity:
                      sending ||
                      !broadcastMsg.trim()
                        ? 0.5
                        : 1,
                  }}
                >
                  {sending
                    ? 'Sending…'
                    : '📢 Send Broadcast'}
                </button>
              </section>

              {/* History */}

              <section
                style={{
                  ...S.card,
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding:
                      '16px 20px',
                    borderBottom:
                      '1px solid #EEF2F7',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0F172A',
                      margin: 0,
                      fontFamily: FONT,
                    }}
                  >
                    📋 Broadcast History
                  </h3>
                </div>

                {broadcastHistory.length ===
                0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      padding:
                        '32px 0',
                      color: '#94A3B8',
                      fontSize: 13,
                      fontFamily: FONT,
                    }}
                  >
                    No broadcasts yet.
                  </p>
                ) : (
                  broadcastHistory.map(
                    (b) => {
                      const c =
                        BROADCAST_COLOR[
                          b.type
                        ] ??
                        '#64748B'

                      return (
                        <div
                          key={b.id}
                          style={{
                            padding:
                              '14px 20px',
                            borderBottom:
                              '1px solid #F8FAFC',
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: 8,
                              marginBottom: 5,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding:
                                  '2px 8px',
                                borderRadius:
                                  99,
                                background: `${c}12`,
                                color: c,
                                border: `0.5px solid ${c}30`,
                                fontFamily:
                                  FONT,
                              }}
                            >
                              {b.type}
                            </span>

                            <span
                              style={{
                                fontSize: 10,
                                color:
                                  '#64748B',
                                fontFamily:
                                  FONT,
                              }}
                            >
                              {b.audience}
                            </span>

                            <span
                              style={{
                                marginLeft:
                                  'auto',
                                fontSize: 9,
                                color:
                                  '#94A3B8',
                                fontFamily:
                                  FONT,
                              }}
                            >
                              {timeAgo(
                                b.sentAt
                              )}
                            </span>
                          </div>

                          <p
                            style={{
                              fontSize: 11,
                              color:
                                '#334155',
                              margin:
                                '0 0 4px',
                              fontFamily:
                                FONT,
                            }}
                          >
                            {b.message}
                          </p>

                          <p
                            style={{
                              fontSize: 9,
                              color:
                                '#94A3B8',
                              margin: 0,
                              fontFamily:
                                FONT,
                            }}
                          >
                            Delivered to{' '}
                            {b.sentTo}{' '}
                            tourists
                          </p>
                        </div>
                      )
                    }
                  )
                )}
              </section>
            </div>
          )}

          <div style={{ height: 16 }} />
        </main>
      </div>

      {/* ══ MODALS ══ */}

      {/* Add Tourist Modal */}

      {addOpen && (
        <div style={S.modalOverlay}>
          <div style={S.modalBox}>
            <div style={S.modalHeader}>
              <h2 style={S.modalTitle}>
                Register New Tourist
              </h2>

              <button
                onClick={() =>
                  setAddOpen(false)
                }
                style={S.modalClose}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {[
                {
                  label: 'Full Name *',
                  key: 'name',
                  placeholder:
                    'e.g. Rahul Sharma',
                },
                {
                  label: 'Email',
                  key: 'email',
                  placeholder:
                    'tourist@example.com',
                },
                {
                  label: 'Phone *',
                  key: 'phone',
                  placeholder:
                    '+91 9876543210',
                },
                {
                  label: 'Nationality',
                  key: 'nationality',
                  placeholder:
                    'Indian',
                },
                {
                  label:
                    'ID Proof Number',
                  key: 'idProofNumber',
                  placeholder:
                    'XXXX-XXXX',
                },
              ].map((f) => (
                <div key={f.key}>
                  <p
                    style={
                      S.fieldLabel
                    }
                  >
                    {f.label}
                  </p>

                  <input
                    value={
                      (newTourist as any)[
                        f.key
                      ]
                    }
                    onChange={(e) =>
                      setNewTourist(
                        (p) => ({
                          ...p,
                          [f.key]:
                            e.target.value,
                        })
                      )
                    }
                    placeholder={
                      f.placeholder
                    }
                    style={S.input}
                  />
                </div>
              ))}

              <div>
                <p
                  style={
                    S.fieldLabel
                  }
                >
                  ID Proof Type
                </p>

                <select
                  value={
                    newTourist.idProofType
                  }
                  onChange={(e) =>
                    setNewTourist(
                      (p) => ({
                        ...p,
                        idProofType:
                          e.target.value,
                      })
                    )
                  }
                  style={S.select}
                >
                  {[
                    'PASSPORT',
                    'AADHAAR',
                    'DRIVING_LICENSE',
                    'VOTER_ID',
                  ].map((o) => (
                    <option key={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  paddingTop: 4,
                }}
              >
                <button
                  onClick={() =>
                    setAddOpen(false)
                  }
                  style={S.ghostBtn}
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleAddTourist
                  }
                  style={S.primaryBtn}
                >
                  Register Tourist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Alert Modal */}

      {addAlertOpen && (
        <div style={S.modalOverlay}>
          <div style={S.modalBox}>
            <div style={S.modalHeader}>
              <h2 style={S.modalTitle}>
                Create New Alert
              </h2>

              <button
                onClick={() =>
                  setAddAlertOpen(false)
                }
                style={S.modalClose}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div>
                <p
                  style={
                    S.fieldLabel
                  }
                >
                  Title *
                </p>

                <input
                  value={newAlert.title}
                  onChange={(e) =>
                    setNewAlert(
                      (p) => ({
                        ...p,
                        title:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="Alert title…"
                  style={S.input}
                />
              </div>

              <div>
                <p
                  style={
                    S.fieldLabel
                  }
                >
                  Description
                </p>

                <textarea
                  value={
                    newAlert.description
                  }
                  onChange={(e) =>
                    setNewAlert(
                      (p) => ({
                        ...p,
                        description:
                          e.target.value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Describe the alert…"
                  style={{
                    ...S.input,
                    resize:
                      'vertical' as const,
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 10,
                }}
              >
                <div>
                  <p
                    style={
                      S.fieldLabel
                    }
                  >
                    Type
                  </p>

                  <select
                    value={newAlert.type}
                    onChange={(e) =>
                      setNewAlert(
                        (p) => ({
                          ...p,
                          type:
                            e.target.value,
                        })
                      )
                    }
                    style={S.select}
                  >
                    {[
                      'CROWD',
                      'WEATHER',
                      'SIGNAL',
                      'CAPACITY',
                      'MEDICAL',
                      'SECURITY',
                    ].map((o) => (
                      <option key={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p
                    style={
                      S.fieldLabel
                    }
                  >
                    Priority
                  </p>

                  <select
                    value={
                      newAlert.priority
                    }
                    onChange={(e) =>
                      setNewAlert(
                        (p) => ({
                          ...p,
                          priority:
                            e.target.value,
                        })
                      )
                    }
                    style={S.select}
                  >
                    {[
                      'HIGH',
                      'MEDIUM',
                      'LOW',
                    ].map((o) => (
                      <option key={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  paddingTop: 4,
                }}
              >
                <button
                  onClick={() =>
                    setAddAlertOpen(
                      false
                    )
                  }
                  style={S.ghostBtn}
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleAddAlert
                  }
                  style={{
                    ...S.primaryBtn,
                    background:
                      'linear-gradient(90deg,#EF4444,#DC2626)',
                  }}
                >
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Zone Modal */}

      {addZoneOpen && (
        <div style={S.modalOverlay}>
          <div style={S.modalBox}>
            <div style={S.modalHeader}>
              <h2 style={S.modalTitle}>
                Add New Zone
              </h2>

              <button
                onClick={() =>
                  setAddZoneOpen(false)
                }
                style={S.modalClose}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div>
                <p
                  style={
                    S.fieldLabel
                  }
                >
                  Zone Name *
                </p>

                <input
                  value={newZone.name}
                  onChange={(e) =>
                    setNewZone(
                      (p) => ({
                        ...p,
                        name:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="e.g. Colaba Causeway"
                  style={S.input}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 10,
                }}
              >
                <div>
                  <p
                    style={
                      S.fieldLabel
                    }
                  >
                    Status
                  </p>

                  <select
                    value={newZone.status}
                    onChange={(e) =>
                      setNewZone(
                        (p) => ({
                          ...p,
                          status:
                            e.target
                              .value as
                              | 'SAFE'
                              | 'WARNING'
                              | 'DANGER',
                        })
                      )
                    }
                    style={S.select}
                  >
                    {[
                      'SAFE',
                      'WARNING',
                      'DANGER',
                    ].map((o) => (
                      <option key={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p
                    style={
                      S.fieldLabel
                    }
                  >
                    Radius (m)
                  </p>

                  <input
                    type="number"
                    value={
                      newZone.radiusMeters
                    }
                    onChange={(e) =>
                      setNewZone(
                        (p) => ({
                          ...p,
                          radiusMeters:
                            +e.target.value,
                        })
                      )
                    }
                    style={S.input}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  paddingTop: 4,
                }}
              >
                <button
                  onClick={() =>
                    setAddZoneOpen(
                      false
                    )
                  }
                  style={S.ghostBtn}
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleAddZone
                  }
                  style={S.primaryBtn}
                >
                  Add Zone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════════════════════════════════ */

export default function AuthorityPage() {
  return (
    <AuthGuard
      allowedRoles={[
        'AUTHORITY',
        'ADMIN',
      ]}
    >
      <AuthorityContent />
    </AuthGuard>
  )
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */

const S: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    background: '#F1F5F9',
    fontFamily: FONT,
    overflow: 'hidden',
    color: '#0F172A',
  },

  /* sidebar */

  sidebar: {
    width: 224,
    background: '#0A1628',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderRight:
      '1px solid rgba(255,255,255,0.06)',
  },

  sbBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '22px 16px 18px',
    borderBottom:
      '1px solid rgba(255,255,255,0.06)',
  },

  sbLogo: {
    width: 34,
    height: 34,
    borderRadius: 9,
    flexShrink: 0,
    background:
      'linear-gradient(135deg,#7C3AED,#A855F7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    boxShadow:
      '0 4px 12px rgba(124,58,237,0.35)',
  },

  sbName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#F8FAFC',
    letterSpacing: '-0.3px',
    margin: 0,
    fontFamily: FONT,
  },

  sbSub: {
    fontSize: 10,
    color: '#475569',
    margin: 0,
    fontFamily: FONT,
  },

  sbNav: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 8px',
    scrollbarWidth: 'none',
  },

  navLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '2px',
    color: '#2D3F5A',
    padding: '14px 10px 6px',
    textTransform: 'uppercase',
    margin: 0,
    fontFamily: FONT,
  },

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 10px',
    borderRadius: 9,
    marginBottom: 1,
    transition: 'background 0.15s',
    position: 'relative',
  },

  navIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    flexShrink: 0,
  },

  navActiveDot: {
    marginLeft: 'auto',
    width: 5,
    height: 5,
    borderRadius: '50%',
    background:
      'rgba(255,255,255,0.5)',
    flexShrink: 0,
  },

  navBadge: {
    marginLeft: 'auto',
    fontSize: 9,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 99,
    background: '#EF4444',
    color: '#fff',
    fontFamily: FONT,
  },

  sbAuthBadge: {
    margin: '0 8px 8px',
    padding: '8px 12px',
    borderRadius: 9,
    background:
      'rgba(168,85,247,0.1)',
    border:
      '0.5px solid rgba(168,85,247,0.25)',
    fontSize: 10,
    fontWeight: 600,
    color: '#A855F7',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontFamily: FONT,
  },

  sbAuthDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#A855F7',
    display: 'inline-block',
    flexShrink: 0,
  },

  sbFooter: {
    padding: '10px 8px',
    borderTop:
      '1px solid rgba(255,255,255,0.06)',
  },

  sbUser: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '9px 10px',
    borderRadius: 9,
    background:
      'rgba(255,255,255,0.04)',
    cursor: 'pointer',
  },

  sbAvatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    flexShrink: 0,
    background:
      'linear-gradient(135deg,#7C3AED,#A855F7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    boxShadow:
      '0 2px 8px rgba(124,58,237,0.3)',
  },

  sbUname: {
    fontSize: 11,
    fontWeight: 600,
    color: '#CBD5E1',
    margin: 0,
    fontFamily: FONT,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  sbUrole: {
    fontSize: 9,
    color: '#475569',
    margin: 0,
    fontFamily: FONT,
  },

  sbOnlineDot: {
    marginLeft: 'auto',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#22C55E',
    flexShrink: 0,
    boxShadow:
      '0 0 0 2px rgba(34,197,94,0.2)',
  },

  /* main */

  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },

  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    padding: '13px 22px',
    background: '#fff',
    borderBottom:
      '1px solid #E8EDF2',
    flexShrink: 0,
    boxShadow:
      '0 1px 3px rgba(0,0,0,0.04)',
  },

  tbTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.4px',
    margin: 0,
    fontFamily: FONT,
  },

  tbSub: {
    fontSize: 11,
    color: '#64748B',
    margin: '2px 0 0',
    fontFamily: FONT,
  },

  tbTime: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748B',
    fontFamily: 'monospace',
  },

  tbRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    fontWeight: 600,
    padding: '4px 11px',
    borderRadius: 99,
    fontFamily: FONT,
  },

  pillGreen: {
    background: '#F0FDF4',
    color: '#166534',
    border:
      '0.5px solid #BBF7D0',
  },

  pillPurple: {
    background: '#FAF5FF',
    color: '#7C3AED',
    border:
      '0.5px solid #E9D5FF',
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block',
  },

  /* content */

  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 22px',
    background: '#F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    scrollbarWidth: 'thin',
    scrollbarColor:
      '#CBD5E1 transparent',
  },

  secLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '2px',
    color: '#94A3B8',
    textTransform: 'uppercase',
    margin: '0 0 11px',
    fontFamily: FONT,
  },

  /* stat cards */

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4,minmax(0,1fr))',
    gap: 12,
  },

  statCard: {
    borderRadius: 14,
    padding: '18px 16px',
    border:
      '1px solid #E8EDF2',
    background: '#fff',
    boxShadow:
      '0 1px 4px rgba(0,0,0,0.04)',
  },

  scIcon: {
    fontSize: 20,
    marginBottom: 10,
  },

  scLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    margin: '0 0 8px',
    fontFamily: FONT,
  },

  scVal: {
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
    lineHeight: 1,
    margin: '4px 0 0',
    fontFamily: FONT,
  },

  scSub: {
    fontSize: 10,
    fontWeight: 600,
    margin: '8px 0 0',
    fontFamily: FONT,
  },

  /* tabs */

  tabRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },

  tab: {
    fontSize: 11,
    fontWeight: 600,
    padding: '7px 16px',
    borderRadius: 9,
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: FONT,
  },

  tabBadge: {
    fontSize: 9,
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 99,
    marginLeft: 2,
    color: '#fff',
    fontFamily: FONT,
  },

  /* card */

  card: {
    borderRadius: 14,
    border:
      '1px solid #E8EDF2',
    background: '#fff',
    padding: '18px 20px',
    boxShadow:
      '0 1px 4px rgba(0,0,0,0.04)',
  },

  /* table */

  table: {
    width: '100%',
    borderCollapse:
      'collapse' as const,
    fontSize: 11,
    fontFamily: FONT,
  },

  th: {
    padding: '9px 12px',
    textAlign: 'left' as const,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform:
      'uppercase' as const,
    color: '#94A3B8',
    borderBottom:
      '1px solid #EEF2F7',
    fontFamily: FONT,
  },

  td: {
    padding: '11px 12px',
    color: '#64748B',
    borderBottom:
      '1px solid #F8FAFC',
    fontFamily: FONT,
  },

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 9,
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: 99,
    border: '0.5px solid',
    fontFamily: FONT,
  },

  /* expand panel */

  expandPanel: {
    borderRadius: 10,
    padding: '14px 16px',
    background: '#F8FAFC',
    border:
      '1px solid #EEF2F7',
    marginTop: 2,
  },

  /* alerts */

  alertRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 14px',
    background: '#FAFBFD',
    borderRadius: 10,
    border:
      '1px solid #EEF2F7',
  },

  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },

  alertTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0F172A',
    margin: 0,
    fontFamily: FONT,
  },

  alertDesc: {
    fontSize: 10,
    color: '#64748B',
    margin: '2px 0 0',
    lineHeight: 1.55,
    fontFamily: FONT,
  },

  badge: {
    fontSize: 9,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 5,
    border: '0.5px solid',
    background: 'transparent',
    fontFamily: FONT,
  },

  /* zones */

  zoneGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3,minmax(0,1fr))',
    gap: 12,
  },

  zoneCard: {
    borderRadius: 14,
    padding: 16,
    border: '1px solid',
    background: '#fff',
    boxShadow:
      '0 1px 4px rgba(0,0,0,0.04)',
  },

  zoneTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  /* form */

  input: {
    width: '100%',
    boxSizing:
      'border-box' as const,
    background: '#F8FAFC',
    border:
      '1px solid #E8EDF2',
    color: '#0F172A',
    borderRadius: 9,
    padding: '9px 13px',
    fontSize: 12,
    fontFamily: FONT,
    outline: 'none',
  },

  select: {
    background: '#F8FAFC',
    border:
      '1px solid #E8EDF2',
    color: '#374151',
    borderRadius: 9,
    padding: '9px 13px',
    fontSize: 12,
    fontFamily: FONT,
    outline: 'none',
  },

  fieldLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform:
      'uppercase' as const,
    color: '#64748B',
    margin: '0 0 5px',
    fontFamily: FONT,
  },

  /* buttons */

  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    padding: '8px 18px',
    borderRadius: 9,
    background:
      'linear-gradient(90deg,#7C3AED,#6D28D9)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontFamily: FONT,
    boxShadow:
      '0 2px 8px rgba(124,58,237,0.2)',
    whiteSpace:
      'nowrap' as const,
  },

  ghostBtn: {
    flex: 1,
    padding: 9,
    borderRadius: 9,
    fontSize: 11,
    fontWeight: 600,
    color: '#64748B',
    background: 'transparent',
    border:
      '1px solid #E2E8F0',
    cursor: 'pointer',
    fontFamily: FONT,
  },

  /* modal */

  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background:
      'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    backdropFilter: 'blur(4px)',
  },

  modalBox: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 480,
    maxWidth: '90vw',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow:
      '0 20px 60px rgba(0,0,0,0.15)',
    border:
      '1px solid #E8EDF2',
  },

  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    fontFamily: FONT,
  },

  modalClose: {
    fontSize: 14,
    color: '#94A3B8',
    background: '#F1F5F9',
    border: 'none',
    borderRadius: 7,
    width: 28,
    height: 28,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT,
  },
}