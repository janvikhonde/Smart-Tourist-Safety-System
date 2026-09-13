'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/layout/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import ToastContainer from '@/components/shared/Toast'
import { toast } from '@/components/shared/Toast'
import { getUser, clearAuth } from '@/lib/auth'

type Section = 'notifications' | 'privacy' | 'location' | 'appearance' | 'security' | 'about'

/* ─── Toggle ─── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 42, height: 23, borderRadius: 99, border: 'none', cursor: 'pointer',
        background: value ? '#2563EB' : '#CBD5E1',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 22 : 3,
        width: 17, height: 17, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

/* ─── Nav Button ─── */
function NavBtn({ icon, label, active, onClick }: {
  icon: string; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
      background: active ? '#EFF6FF' : 'transparent',
      borderLeft: active ? '2.5px solid #2563EB' : '2.5px solid transparent',
      transition: 'all 0.15s', marginBottom: 2,
    }}>
      <span style={{
        width: 30, height: 30, borderRadius: 7, fontSize: 14,
        background: active ? '#DBEAFE' : '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: active ? '#2563EB' : '#64748B' }}>
        {label}
      </span>
    </button>
  )
}

/* ─── Row ─── */
function Row({ icon, title, desc, children, danger }: {
  icon: string; title: string; desc?: string; children?: React.ReactNode; danger?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '0.5px solid #F1F5F9',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8, fontSize: 14, flexShrink: 0,
          background: danger ? '#FFF1F2' : '#F8FAFC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '0.5px solid ' + (danger ? '#FECDD3' : '#E2E8F0'),
        }}>{icon}</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: danger ? '#BE123C' : '#0F172A', margin: 0 }}>
            {title}
          </p>
          {desc && <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{desc}</p>}
        </div>
      </div>
      <div style={{ flexShrink: 0, marginLeft: 16 }}>{children}</div>
    </div>
  )
}

/* ─── Card ─── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #E2E8F0',
      borderRadius: 14, padding: '16px 20px', marginBottom: 12,
    }}>
      <p style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#94A3B8',
        textTransform: 'uppercase', margin: '0 0 4px',
      }}>{title}</p>
      {children}
    </div>
  )
}

/* ─── Select ─── */
function Sel({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background: '#F8FAFC', border: '0.5px solid #E2E8F0',
      color: '#0F172A', borderRadius: 8, padding: '5px 10px',
      fontSize: 12, cursor: 'pointer', outline: 'none', fontWeight: 500,
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

/* ════════════════════════════════
   SETTINGS CONTENT
════════════════════════════════ */
function SettingsContent() {
  const user   = getUser()
  const router = useRouter()
  const [section, setSection] = useState<Section>('notifications')

  const [notif, setNotif] = useState({
    sosAlerts: true, geofenceAlerts: true, weatherAlerts: true,
    crowdAlerts: false, emailDigest: false, soundEnabled: true, vibration: true,
  })
  const [privacy, setPrivacy] = useState({
    shareLocation: true, shareToAuthority: true, anonymousMode: false, dataCollection: true,
  })
  const [loc, setLoc] = useState({
    highAccuracy: true, backgroundTracking: true, autoCheckin: false, locationHistory: true,
  })
  const [updateInterval, setUpdateInterval] = useState('30')
  const [appearance, setAppearance] = useState({
    compactMode: false, animations: true, highContrast: false,
  })
  const [language, setLanguage] = useState('en')
  const [units,    setUnits]    = useState('metric')
  const [security, setSecurity] = useState({
    twoFactor: false, biometric: false, autoLogout: true,
  })
  const [autoLogoutMins, setAutoLogoutMins] = useState('30')

  const SECTIONS: { id: Section; icon: string; label: string }[] = [
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'privacy',       icon: '🔒', label: 'Privacy'       },
    { id: 'location',      icon: '📍', label: 'Location'      },
    { id: 'appearance',    icon: '🎨', label: 'Appearance'    },
    { id: 'security',      icon: '🛡️', label: 'Security'      },
    { id: 'about',         icon: 'ℹ️',  label: 'About'        },
  ]

  const btnBlue: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 7,
    background: '#EFF6FF', color: '#2563EB', border: '0.5px solid #BFDBFE', cursor: 'pointer',
  }
  const btnRed: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 7,
    background: '#FFF1F2', color: '#BE123C', border: '0.5px solid #FECDD3', cursor: 'pointer',
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden', background: '#F8FAFC',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', background: '#fff', borderBottom: '0.5px solid #E2E8F0', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
              Settings
            </h1>
            <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
              Welcome back, {user?.name ?? 'Traveller'} — manage your preferences
            </p>
          </div>
          <button
            onClick={() => toast.success('Settings saved!')}
            style={{
              fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 8,
              background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer',
            }}>
            💾 Save Changes
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

          {/* Left Nav */}
          <div style={{
            width: 196, flexShrink: 0, padding: '16px 10px',
            borderRight: '0.5px solid #E2E8F0', background: '#fff',
            display: 'flex', flexDirection: 'column',
          }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#CBD5E1',
              textTransform: 'uppercase', margin: '0 0 10px 4px',
            }}>Preferences</p>

            {SECTIONS.map(s => (
              <NavBtn key={s.id} icon={s.icon} label={s.label}
                active={section === s.id} onClick={() => setSection(s.id)} />
            ))}

            <div style={{ flex: 1 }} />

            <div style={{ paddingTop: 12, borderTop: '0.5px solid #F1F5F9' }}>
              <button
                onClick={() => { clearAuth(); router.replace('/auth/login') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: 'transparent',
                }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 7, fontSize: 14,
                  background: '#FFF1F2', border: '0.5px solid #FECDD3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>🚪</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#BE123C' }}>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div style={{
            flex: 1, padding: '20px 24px', overflowY: 'auto',
            scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent',
          }}>

            {/* NOTIFICATIONS */}
            {section === 'notifications' && <>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>🔔 Notifications</p>
              <Card title="Safety Alerts">
                <Row icon="🆘" title="SOS Panic Alerts" desc="Immediate alert when SOS is triggered">
                  <Toggle value={notif.sosAlerts} onChange={v => setNotif(p => ({ ...p, sosAlerts: v }))} />
                </Row>
                <Row icon="📍" title="Geo-fence Alerts" desc="When entering or exiting a zone">
                  <Toggle value={notif.geofenceAlerts} onChange={v => setNotif(p => ({ ...p, geofenceAlerts: v }))} />
                </Row>
                <Row icon="🌩️" title="Weather Alerts" desc="Severe weather warnings in your area">
                  <Toggle value={notif.weatherAlerts} onChange={v => setNotif(p => ({ ...p, weatherAlerts: v }))} />
                </Row>
                <Row icon="👥" title="Crowd Density Alerts" desc="Notified when crowd exceeds threshold">
                  <Toggle value={notif.crowdAlerts} onChange={v => setNotif(p => ({ ...p, crowdAlerts: v }))} />
                </Row>
              </Card>
              <Card title="Delivery">
                <Row icon="📧" title="Email Digest" desc="Daily summary of your trip activity">
                  <Toggle value={notif.emailDigest} onChange={v => setNotif(p => ({ ...p, emailDigest: v }))} />
                </Row>
                <Row icon="🔊" title="Sound" desc="Play alert sounds">
                  <Toggle value={notif.soundEnabled} onChange={v => setNotif(p => ({ ...p, soundEnabled: v }))} />
                </Row>
                <Row icon="📳" title="Vibration" desc="Vibrate on alert">
                  <Toggle value={notif.vibration} onChange={v => setNotif(p => ({ ...p, vibration: v }))} />
                </Row>
              </Card>
            </>}

            {/* PRIVACY */}
            {section === 'privacy' && <>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>🔒 Privacy</p>
              <Card title="Location Sharing">
                <Row icon="📍" title="Share My Location" desc="Enable real-time location tracking">
                  <Toggle value={privacy.shareLocation} onChange={v => setPrivacy(p => ({ ...p, shareLocation: v }))} />
                </Row>
                <Row icon="🏛️" title="Share with Authorities" desc="Safety authorities can see your location">
                  <Toggle value={privacy.shareToAuthority} onChange={v => setPrivacy(p => ({ ...p, shareToAuthority: v }))} />
                </Row>
                <Row icon="🕵️" title="Anonymous Mode" desc="Hide your name from public views">
                  <Toggle value={privacy.anonymousMode} onChange={v => setPrivacy(p => ({ ...p, anonymousMode: v }))} />
                </Row>
              </Card>
              <Card title="Data">
                <Row icon="📊" title="Usage Data Collection" desc="Help improve SafeTrail anonymously">
                  <Toggle value={privacy.dataCollection} onChange={v => setPrivacy(p => ({ ...p, dataCollection: v }))} />
                </Row>
                <Row icon="🗑️" title="Delete My Data" desc="Permanently remove all your data" danger>
                  <button style={btnRed}>Delete</button>
                </Row>
              </Card>
            </>}

            {/* LOCATION */}
            {section === 'location' && <>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>📍 Location</p>
              <Card title="Tracking">
                <Row icon="🎯" title="High Accuracy GPS" desc="More precise, uses more battery">
                  <Toggle value={loc.highAccuracy} onChange={v => setLoc(p => ({ ...p, highAccuracy: v }))} />
                </Row>
                <Row icon="🔄" title="Background Tracking" desc="Track when app is minimized">
                  <Toggle value={loc.backgroundTracking} onChange={v => setLoc(p => ({ ...p, backgroundTracking: v }))} />
                </Row>
                <Row icon="✅" title="Auto Check-in" desc="Auto check-in at popular spots">
                  <Toggle value={loc.autoCheckin} onChange={v => setLoc(p => ({ ...p, autoCheckin: v }))} />
                </Row>
                <Row icon="📜" title="Location History" desc="Keep a log of visited places">
                  <Toggle value={loc.locationHistory} onChange={v => setLoc(p => ({ ...p, locationHistory: v }))} />
                </Row>
              </Card>
              <Card title="Update Frequency">
                <Row icon="⏱️" title="Update Interval" desc="How often location is sent to server">
                  <Sel value={updateInterval} onChange={setUpdateInterval} options={[
                    { value: '10',  label: 'Every 10s'   },
                    { value: '30',  label: 'Every 30s'   },
                    { value: '60',  label: 'Every 1 min' },
                    { value: '300', label: 'Every 5 min' },
                  ]} />
                </Row>
              </Card>
            </>}

            {/* APPEARANCE */}
            {section === 'appearance' && <>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>🎨 Appearance</p>
              <Card title="Display">
                <Row icon="📐" title="Compact Mode" desc="Reduce spacing for more content">
                  <Toggle value={appearance.compactMode} onChange={v => setAppearance(p => ({ ...p, compactMode: v }))} />
                </Row>
                <Row icon="✨" title="Animations" desc="Enable smooth transitions">
                  <Toggle value={appearance.animations} onChange={v => setAppearance(p => ({ ...p, animations: v }))} />
                </Row>
                <Row icon="👁️" title="High Contrast" desc="Increase contrast for readability">
                  <Toggle value={appearance.highContrast} onChange={v => setAppearance(p => ({ ...p, highContrast: v }))} />
                </Row>
              </Card>
              <Card title="Regional">
                <Row icon="🌐" title="Language" desc="Interface language">
                  <Sel value={language} onChange={setLanguage} options={[
                    { value: 'en', label: 'English' },
                    { value: 'hi', label: 'Hindi'   },
                    { value: 'mr', label: 'Marathi'  },
                    { value: 'ta', label: 'Tamil'    },
                  ]} />
                </Row>
                <Row icon="📏" title="Units" desc="Measurement system">
                  <Sel value={units} onChange={setUnits} options={[
                    { value: 'metric',   label: 'Metric (km, °C)'   },
                    { value: 'imperial', label: 'Imperial (mi, °F)' },
                  ]} />
                </Row>
              </Card>
            </>}

            {/* SECURITY */}
            {section === 'security' && <>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>🛡️ Security</p>
              <Card title="Authentication">
                <Row icon="📱" title="Two-Factor Authentication" desc="Extra security via OTP">
                  <Toggle value={security.twoFactor} onChange={v => setSecurity(p => ({ ...p, twoFactor: v }))} />
                </Row>
                <Row icon="👆" title="Biometric Login" desc="Fingerprint or Face ID">
                  <Toggle value={security.biometric} onChange={v => setSecurity(p => ({ ...p, biometric: v }))} />
                </Row>
                <Row icon="⏲️" title="Auto Logout" desc="Sign out after inactivity">
                  <Toggle value={security.autoLogout} onChange={v => setSecurity(p => ({ ...p, autoLogout: v }))} />
                </Row>
                {security.autoLogout && (
                  <Row icon="⏱️" title="Logout After" desc="Inactivity timeout">
                    <Sel value={autoLogoutMins} onChange={setAutoLogoutMins} options={[
                      { value: '15',  label: '15 minutes' },
                      { value: '30',  label: '30 minutes' },
                      { value: '60',  label: '1 hour'     },
                      { value: '120', label: '2 hours'    },
                    ]} />
                  </Row>
                )}
              </Card>
              <Card title="Account Actions">
                <Row icon="🔑" title="Change Password" desc="Update your account password">
                  <button style={btnBlue}>Change</button>
                </Row>
                <Row icon="🚨" title="Deactivate Account" desc="Temporarily disable your account" danger>
                  <button style={btnRed}>Deactivate</button>
                </Row>
              </Card>
            </>}

            {/* ABOUT */}
            {section === 'about' && <>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>ℹ️ About</p>
              <Card title="App Info">
                <Row icon="🛡️" title="SafeTrail" desc="Smart Tourist Safety Platform">
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>v1.0.0</span>
                </Row>
                <Row icon="📍" title="Region" desc="Aurangabad · Maharashtra · India">
                  <span style={{ fontSize: 13 }}>🇮🇳</span>
                </Row>
                <Row icon="⚙️" title="Stack" desc="Next.js 14 · Spring Boot · WebSocket">
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                    background: '#F0FDF4', color: '#166534', border: '0.5px solid #BBF7D0',
                  }}>stable</span>
                </Row>
              </Card>
              <Card title="Logged In As">
                <Row icon="👤" title={user?.name ?? 'Traveller'} desc={user?.email ?? ''}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                    background: '#EFF6FF', color: '#1D4ED8', border: '0.5px solid #BFDBFE',
                  }}>{user?.role}</span>
                </Row>
              </Card>
              <Card title="Legal">
                {['Terms of Service', 'Privacy Policy', 'Licenses'].map(t => (
                  <Row key={t} icon="📄" title={t}>
                    <span style={{ fontSize: 12, color: '#CBD5E1' }}>›</span>
                  </Row>
                ))}
              </Card>
            </>}

            <div style={{ height: 24 }} />
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}

export default function SettingsPageWrapper() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}