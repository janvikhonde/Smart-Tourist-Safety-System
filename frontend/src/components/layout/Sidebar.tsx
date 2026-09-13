'use client'
import { useRouter, usePathname } from 'next/navigation'
import { getUser } from '@/lib/auth'

interface Props {
  children?: React.ReactNode
}

const NAV_MAIN = [
  { href: '/dashboard/tourist',   icon: '🏠', label: 'Dashboard',     roles: ['TOURIST'] },
  { href: '/dashboard/admin',     icon: '🏠', label: 'Dashboard',     roles: ['ADMIN'] },
  { href: '/dashboard/authority', icon: '🏠', label: 'Dashboard',     roles: ['AUTHORITY'] },
  { href: '/dashboard/guide',     icon: '🏠', label: 'Dashboard',     roles: ['TOUR_GUIDE'] },
  { href: '/tracking',            icon: '📍', label: 'Live Tracking', roles: ['TOURIST', 'AUTHORITY', 'ADMIN'] },
  { href: '/emergency',           icon: '🆘', label: 'Emergency',     roles: ['TOURIST', 'AUTHORITY', 'ADMIN'], badge: '!' },
  { href: '/places',              icon: '🏛️', label: 'Nearby Places', roles: ['TOURIST'] },
]

const NAV_GUIDE = [
  { href: '/dashboard/guide/add-place', icon: '➕', label: 'Add Destination', roles: ['TOUR_GUIDE'] },
  { href: '/dashboard/guide/my-places', icon: '📋', label: 'My Places',       roles: ['TOUR_GUIDE'] },
  { href: '/tour-picks',                icon: '🗺️', label: 'Tour Picks',      roles: ['TOUR_GUIDE'] },
  { href: '/dashboard/guide/weather',   icon: '⛅', label: 'Weather',         roles: ['TOUR_GUIDE'] },
  { href: '/dashboard/guide/routes',    icon: '🧭', label: 'Routes & Maps',   roles: ['TOUR_GUIDE'] },
]

const NAV_EXPLORE = [
  { href: '/tour-picks',   icon: '🗺️', label: 'Tour Picks',   roles: ['TOURIST'] },
  { href: '/weather',      icon: '⛅',  label: 'Weather',      roles: ['TOURIST', 'AUTHORITY', 'ADMIN'] },
  { href: '/ai-assistant', icon: '🤖', label: 'AI Assistant', roles: ['TOURIST', 'AUTHORITY', 'ADMIN'] },
]

const NAV_ACCOUNT = [
  { href: '/profile',  icon: '👤', label: 'My Profile', roles: ['TOURIST', 'AUTHORITY', 'ADMIN', 'TOUR_GUIDE'] },
  { href: '/settings', icon: '⚙️', label: 'Settings',   roles: ['TOURIST', 'AUTHORITY', 'ADMIN', 'TOUR_GUIDE'] },
]

const S: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220, background: '#0F172A', display: 'flex',
    flexDirection: 'column', flexShrink: 0,
    borderRight: '0.5px solid #1E293B', height: '100vh',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 16px 16px', borderBottom: '0.5px solid #1E293B',
  },
  logo: {
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    background: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
  },
  brandName: { fontSize: 13, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.2px', margin: 0 },
  brandSub:  { fontSize: 10, color: '#475569', margin: 0 },
  nav: {
    flex: 1, overflowY: 'auto', padding: '12px 8px',
    scrollbarWidth: 'thin', scrollbarColor: '#1E293B transparent',
  },
  label: {
    fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#334155',
    padding: '12px 8px 6px', textTransform: 'uppercase', margin: 0,
  },
  guideDivider: {
    fontSize: 9, fontWeight: 700, letterSpacing: 2,
    padding: '12px 8px 6px', textTransform: 'uppercase', margin: 0,
    color: '#f59e0b',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  item: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
  },
  icon: {
    width: 28, height: 28, borderRadius: 6, background: '#1E293B',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, flexShrink: 0,
  },
  guideIcon: {
    width: 28, height: 28, borderRadius: 6,
    background: 'rgba(251,191,36,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, flexShrink: 0,
  },
  badge: {
    marginLeft: 'auto', fontSize: 9, fontWeight: 700,
    padding: '2px 6px', borderRadius: 99, background: '#EF4444', color: '#fff',
  },
  footer: { padding: '12px 8px', borderTop: '0.5px solid #1E293B' },
  user:   { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8 },
  avatar: {
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#fff',
  },
  guideAvatar: {
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#f59e0b,#f97316)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#fff',
  },
  uname: { fontSize: 11, fontWeight: 600, color: '#CBD5E1', margin: 0 },
  urole: { fontSize: 9, color: '#475569', margin: 0 },
  guideBadge: {
    fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
    background: 'rgba(251,191,36,0.15)', color: '#f59e0b',
    border: '1px solid rgba(251,191,36,0.2)', marginTop: 2,
  },
}

export default function Sidebar({ children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = getUser()
  const role     = user?.role ?? 'TOURIST'
  const isTourGuide = role === 'TOUR_GUIDE'

  const initials = (user?.name ?? 'TU')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  type NavItem = { href: string; icon: string; label: string; roles: string[]; badge?: string }

  const NavGroup = ({
    label,
    items,
    isGuideSection = false,
  }: {
    label: string
    items: NavItem[]
    isGuideSection?: boolean
  }) => {
    const visible = items.filter(i => i.roles.includes(role))
    if (!visible.length) return null
    return (
      <>
        {isGuideSection ? (
          <p style={S.guideDivider}>
            <span>🗺️</span> {label}
          </p>
        ) : (
          <p style={S.label}>{label}</p>
        )}
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <div
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                ...S.item,
                background: active
                  ? isGuideSection
                    ? 'rgba(251,191,36,0.18)'
                    : '#1D4ED8'
                  : 'transparent',
                borderLeft: active && isGuideSection ? '2px solid #f59e0b' : '2px solid transparent',
              }}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push(item.href)}
            >
              <span style={isGuideSection ? S.guideIcon : S.icon}>{item.icon}</span>
              <span style={{
                fontSize: 12, fontWeight: 500,
                color: active
                  ? isGuideSection ? '#fbbf24' : '#fff'
                  : isGuideSection ? '#a78b50' : '#94A3B8',
              }}>
                {item.label}
              </span>
              {item.badge && <span style={S.badge}>{item.badge}</span>}
            </div>
          )
        })}
      </>
    )
  }

  return (
    <aside style={S.sidebar}>
      {/* Brand */}
      <div style={S.brand}>
        <div style={S.logo}>🛡️</div>
        <div>
          <p style={S.brandName}>SafeTrail</p>
          <p style={S.brandSub}>Tourist Safety Platform</p>
        </div>
      </div>

      <nav style={S.nav}>
        <NavGroup label="Main"    items={NAV_MAIN}    />

        {/* Tour Guide exclusive section */}
        {isTourGuide && (
          <NavGroup label="Guide Tools" items={NAV_GUIDE} isGuideSection />
        )}

        {/* Non-guide explore items */}
        {!isTourGuide && (
          <NavGroup label="Explore" items={NAV_EXPLORE} />
        )}

        <NavGroup label="Account" items={NAV_ACCOUNT} />
      </nav>

      {/* Footer */}
      <div style={S.footer}>
        {isTourGuide && (
          <div style={{
            padding: '6px 10px', marginBottom: 6, borderRadius: 8,
            background: 'rgba(251,191,36,0.07)',
            border: '1px solid rgba(251,191,36,0.12)',
          }}>
            <p style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700, margin: 0, letterSpacing: 1 }}>
              🗺️ TOUR GUIDE MODE
            </p>
          </div>
        )}
        <div style={S.user}>
          <div style={isTourGuide ? S.guideAvatar : S.avatar}>{initials}</div>
          <div>
            <p style={S.uname}>{user?.name ?? 'Traveller'}</p>
            <p style={S.urole}>{role} · Active</p>
          </div>
        </div>
      </div>

      {children}
    </aside>
  )
}