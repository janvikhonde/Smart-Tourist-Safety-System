'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import { usePathname, useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { formatTime } from '@/lib/utils'

/* ─────────────── nav config ─────────────── */
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

/* ─────────────── types ─────────────── */
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface LiveContext {
  lat: number | null
  lng: number | null
  city: string
  state: string
  country: string
  weather: string
  tempC: number | null
  humidity: number | null
  windKph: number | null
  time: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

/* ─────────────── helpers ─────────────── */
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

function getNow(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Strip common Indian admin suffixes from any place name */
function stripSuffix(raw: string): string {
  return raw
    .replace(/\s+(District|Division|Tehsil|Taluka|Block|Sub-district|Nagar Panchayat|Nagar Parishad|Municipal Corporation|Municipal Council|Cantonment|Nagar)$/i, '')
    .trim()
}

/**
 * Extract the best city name from a Nominatim address object.
 * For Indian cities, Nominatim often returns the correct city in addr.city
 * but sometimes puts it in addr.town or addr.county. We try all candidates.
 */
function extractCityFromNominatim(addr: Record<string, string>): string {
  // For Indian addresses, these fields in priority order give the best city name
  const candidates = [
    addr.city,           // e.g. "Nanded" ✅
    addr.town,           // smaller towns
    addr.municipality,
    addr.village,
    addr.suburb,
    addr.city_district,
    addr.county,         // sometimes has district name — strip suffix
    addr.state_district, // e.g. "Nanded District" → strip to "Nanded"
    addr.state,
  ]

  for (const raw of candidates) {
    if (!raw) continue
    const clean = stripSuffix(raw)
    if (clean.length > 1) return clean
  }
  return ''
}

/**
 * Try multiple geocoding services to get an accurate city name.
 * Returns { city, state, country } or null.
 */
async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; state: string; country: string } | null> {

  // ── 1. Nominatim (OpenStreetMap) — most detailed for India ──
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=10`,
      {
        headers: {
          'User-Agent':       'SafeTrail-App/1.0 (safetrail@example.com)',
          'Accept-Language':  'en-US,en;q=0.9',
        },
      }
    )
    if (res.ok) {
      const data = await res.json()
      const addr = data?.address ?? {}
      const city = extractCityFromNominatim(addr)
      if (city) {
        return {
          city,
          state:   addr.state   || '',
          country: addr.country || 'India',
        }
      }
    }
  } catch { /* ignore */ }

  // ── 2. BigDataCloud — good for Indian localities ──
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    )
    if (res.ok) {
      const data = await res.json()

      // Try the most specific locality first
      const candidates = [
        data?.city,
        data?.locality,
        data?.localityInfo?.administrative
          ?.filter((a: { adminLevel: number }) => a.adminLevel >= 7)
          ?.sort((a: { adminLevel: number }, b: { adminLevel: number }) => b.adminLevel - a.adminLevel)
          ?.[0]?.name,
        data?.principalSubdivision,
      ]

      for (const raw of candidates) {
        if (!raw) continue
        const clean = stripSuffix(raw)
        if (clean.length > 1) {
          return {
            city:    clean,
            state:   data?.principalSubdivision || '',
            country: data?.countryName          || 'India',
          }
        }
      }
    }
  } catch { /* ignore */ }

  // ── 3. Open-Meteo geocoding (city name from coords, very reliable) ──
  try {
    // Use Nominatim again with zoom=8 for a broader search
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=8`,
      { headers: { 'User-Agent': 'SafeTrail-App/1.0', 'Accept-Language': 'en-US,en;q=0.9' } }
    )
    if (res.ok) {
      const data = await res.json()
      const addr = data?.address ?? {}
      const city = extractCityFromNominatim(addr)
      if (city) {
        return { city, state: addr.state || '', country: addr.country || 'India' }
      }
    }
  } catch { /* ignore */ }

  return null
}

function weatherCodeToText(code: number): string {
  if (code === 0)  return 'Clear Sky'
  if (code <= 2)   return 'Partly Cloudy'
  if (code === 3)  return 'Overcast'
  if (code <= 49)  return 'Foggy'
  if (code <= 59)  return 'Drizzle'
  if (code <= 69)  return 'Rainy'
  if (code <= 79)  return 'Snowy'
  if (code <= 82)  return 'Rain Showers'
  if (code <= 99)  return 'Thunderstorm'
  return 'Clear'
}

function getSuggestions(ctx: LiveContext): string[] {
  const city = ctx.city || 'my location'
  const tod  = ctx.timeOfDay
  const timeChips: Record<string, string[]> = {
    morning:   [`Best morning places to visit in ${city}`, 'Sunrise viewpoints near me'],
    afternoon: [`Beat the heat in ${city} — indoor spots?`, 'Shaded attractions near me'],
    evening:   [`Evening markets and street food in ${city}`, 'Safe evening walks near me'],
    night:     [`24-hour services near ${city}`, 'Night safety tips for tourists in India'],
  }
  return [
    ...(timeChips[tod] || []),
    `Is it safe to travel around ${city} right now?`,
    `Top tourist attractions near ${city}`,
    `Best local food in ${city}`,
    `Nearest hospital to my location`,
    `Emergency contacts in ${city}`,
  ].slice(0, 6)
}

function renderContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,     '<em>$1</em>')
    .replace(/`(.*?)`/g,       '<code style="background:#F1F5F9;padding:1px 6px;border-radius:4px;font-size:11px;color:#0F172A;font-family:monospace">$1</code>')
    .replace(/^### (.+)$/gm,   '<p style="font-size:12px;font-weight:800;color:#0F172A;margin:12px 0 4px;letter-spacing:-0.2px">$1</p>')
    .replace(/^## (.+)$/gm,    '<p style="font-size:13px;font-weight:800;color:#0F172A;margin:12px 0 4px">$1</p>')
    .replace(/^- (.+)$/gm,     '<div style="display:flex;gap:7px;margin:3px 0;align-items:flex-start"><span style="color:#3B82F6;font-weight:700;flex-shrink:0;margin-top:1px">•</span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, (_full, p1, offset, str) => {
      const num = str.slice(0, offset).split('\n').filter((l: string) => /^\d+\./.test(l)).length + 1
      return `<div style="display:flex;gap:7px;margin:3px 0;align-items:flex-start"><span style="color:#3B82F6;font-weight:700;flex-shrink:0;min-width:18px">${num}.</span><span>${p1}</span></div>`
    })
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g,     '<br/>')
}

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = getUser()
  const initials = (user?.name ?? 'TU')
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
            style={{ ...S.navItem, background: active ? '#1D4ED8' : 'transparent', cursor: 'pointer' }}
            role="link" tabIndex={0}
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

/* ════════════════════════════════════════
   MAIN AI CONTENT
════════════════════════════════════════ */
function AIContent() {
  const user = getUser()

  const [ctx, setCtx] = useState<LiveContext>({
    lat: null, lng: null,
    city: '', state: '', country: 'India',
    weather: '—', tempC: null, humidity: null, windKph: null,
    time: getNow(), timeOfDay: getTimeOfDay(),
  })
  const [locationStatus, setLocationStatus] = useState<'loading' | 'gps' | 'ip' | 'denied'>('loading')
  const [messages,    setMessages]    = useState<ChatMessage[]>([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const ctxRef     = useRef(ctx)
  const historyRef = useRef<{ role: string; content: string }[]>([])

  useEffect(() => { ctxRef.current = ctx }, [ctx])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setCtx(p => ({ ...p, time: getNow(), timeOfDay: getTimeOfDay() })), 60_000)
    return () => clearInterval(t)
  }, [])

  /* ── STEP 1: Try GPS first, fallback to IP ── */
  useEffect(() => {
    if (!navigator.geolocation) {
      fetchByIP()
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocationStatus('gps')
        await initLocation(pos.coords.latitude, pos.coords.longitude, 'gps')
      },
      async (err) => {
        console.warn('GPS denied/failed:', err.message)
        await fetchByIP()
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── IP-based location (3 services tried in order) ── */
  const fetchByIP = async () => {
    // Service 1: ip-api.com
    try {
      const res  = await fetch('https://ip-api.com/json/?fields=status,city,regionName,country,lat,lon')
      const data = await res.json()
      if (data.status === 'success' && data.city && data.lat) {
        setLocationStatus('ip')
        await initLocation(data.lat, data.lon, 'ip', {
          city:    stripSuffix(data.city),
          state:   data.regionName || '',
          country: data.country    || 'India',
        })
        return
      }
    } catch { /* ignore */ }

    // Service 2: ipinfo.io
    try {
      const res  = await fetch('https://ipinfo.io/json')
      const data = await res.json()
      if (data.city && data.loc) {
        setLocationStatus('ip')
        const [latStr, lngStr] = data.loc.split(',')
        await initLocation(parseFloat(latStr), parseFloat(lngStr), 'ip', {
          city:    stripSuffix(data.city),
          state:   data.region  || '',
          country: data.country || 'India',
        })
        return
      }
    } catch { /* ignore */ }

    // Service 3: freeipapi.com
    try {
      const res  = await fetch('https://freeipapi.com/api/json')
      const data = await res.json()
      if (data.cityName && data.latitude) {
        setLocationStatus('ip')
        await initLocation(data.latitude, data.longitude, 'ip', {
          city:    stripSuffix(data.cityName),
          state:   data.regionName || '',
          country: data.countryName || 'India',
        })
        return
      }
    } catch { /* ignore */ }

    // All failed — use Nanded as default
    setLocationStatus('denied')
    await initLocation(19.1383, 77.3210, 'denied', {
      city: 'Nanded', state: 'Maharashtra', country: 'India',
    })
  }

  /* ── Core init: geocode (if needed) + weather ── */
  const initLocation = async (
    lat: number,
    lng: number,
    source: 'gps' | 'ip' | 'denied',
    knownCity?: { city: string; state: string; country: string }
  ) => {
    let city    = knownCity?.city    || ''
    let state   = knownCity?.state   || ''
    let country = knownCity?.country || 'India'

    // For GPS we always do reverse geocoding (more accurate than IP city names)
    // For IP we still try geocoding to get a better/verified city name
    if (source === 'gps' || !city) {
      const geo = await reverseGeocode(lat, lng)
      if (geo?.city) {
        city    = geo.city
        state   = geo.state   || state
        country = geo.country || country
      }
    }

    // Final fallback if still no city
    if (!city) city = `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`

    // Fetch weather from Open-Meteo
    let weather  = 'Clear'
    let tempC:    number | null = null
    let humidity: number | null = null
    let windKph:  number | null = null
    try {
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode&timezone=auto`
      )
      if (wRes.ok) {
        const wData = await wRes.json()
        const cur   = wData?.current ?? {}
        tempC    = Math.round(cur.temperature_2m      ?? 30)
        humidity = Math.round(cur.relativehumidity_2m  ?? 50)
        windKph  = Math.round(cur.windspeed_10m        ?? 10)
        weather  = weatherCodeToText(cur.weathercode   ?? 0)
      }
    } catch { /* ignore */ }

    const updatedCtx: LiveContext = {
      lat, lng, city, state, country,
      weather, tempC, humidity, windKph,
      time: getNow(), timeOfDay: getTimeOfDay(),
    }
    setCtx(updatedCtx)
    setSuggestions(getSuggestions(updatedCtx))

    const locationLine = state ? `${city}, ${state}` : city
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! I'm **SafeTrail AI** — your intelligent travel & safety companion. 🛡️

📍 **Your location:** ${locationLine}
🌤 **Weather:** ${tempC !== null ? `${tempC}°C` : ''} · ${weather}${humidity ? ` · Humidity ${humidity}%` : ''}
🕐 **Local time:** ${getNow()}

I'm fully aware of your **live location** and can help you with safety, food, places, transport, emergencies, culture, and anything else you need. What would you like to know?`,
      timestamp: new Date().toISOString(),
    }])
    historyRef.current = []
  }

  /* ── System prompt ── */
  const buildSystemPrompt = (lc: LiveContext): string => {
    const locationFull = lc.state
      ? `${lc.city}, ${lc.state}, ${lc.country}`
      : `${lc.city}, ${lc.country}`

    return `You are SafeTrail AI, an expert travel safety assistant built into the SafeTrail tourist safety app for India. You have comprehensive knowledge about every city, town, district, and region across India.

=== LIVE USER CONTEXT ===
- Location     : ${locationFull}
- GPS coords   : ${lc.lat?.toFixed(5) ?? 'N/A'}, ${lc.lng?.toFixed(5) ?? 'N/A'}
- Weather      : ${lc.tempC !== null ? `${lc.tempC}°C` : 'unknown'}, ${lc.weather}${lc.humidity ? `, humidity ${lc.humidity}%` : ''}${lc.windKph ? `, wind ${lc.windKph} km/h` : ''}
- Time         : ${lc.timeOfDay} (${lc.time})
- User         : ${user?.name ?? 'Tourist'} (tourist)

=== CORE RULES ===
1. ALWAYS answer every question fully and directly — never refuse, never say "I can't help with that".
2. Be a knowledgeable local friend: warm, confident, practical, and accurate.
3. Use your training knowledge to give real, specific answers about ${lc.city} and surroundings.
4. For ANY question — travel, science, math, history, coding, recipes, general knowledge — just answer it.
5. Always reference the user's location (${lc.city}) naturally when it's relevant.
6. For emergencies always include: Police 100 · Ambulance 108 · Fire 101 · National 112.

=== SPECIALIST KNOWLEDGE FOR ${locationFull.toUpperCase()} ===
🛡️ Safety       — area safety ratings, tourist scams, safe zones, what areas to avoid, time-of-day tips
🌤️ Weather       — heat advisories, rain forecast, UV warnings, best times to go out, what to wear
🏛️ Places        — all tourist attractions, monuments, temples, museums, timings, entry fees, hidden gems
🍽️ Food          — famous local dishes, best restaurants, street food spots, hygiene tips, veg/non-veg options
🚗 Transport     — auto/cab fares, bus routes, trains, Ola/Uber availability, parking info, walking routes
🏥 Emergency     — hospitals, clinics, police stations, 24hr pharmacies, blood banks, ambulance contacts
💊 Health        — travel health advice, medicines to carry, heat stroke prevention, water safety, vaccinations
🌏 Culture       — dress codes, temple etiquette, local customs, festivals calendar, language tips
💰 Money         — ATM locations, UPI acceptance, currency exchange, budgeting, typical costs
🗣️ Language      — Marathi/Hindi phrases, how to communicate with locals, translation help
✈️ Logistics     — best areas to stay, travel to nearby cities, day trip options from ${lc.city}
🎯 General       — ANY topic the user asks about: history, science, math, coding, recipes, trivia

=== RESPONSE FORMAT ===
- Use **bold** for key facts and place names.
- Use bullet points (- item) for lists of 3+ items.
- Use numbered lists for step-by-step instructions.
- Use ## Heading for sections in long answers.
- Keep answers focused — don't pad with unnecessary caveats.
- For short factual questions, answer in 1-3 sentences.
- For complex topics, use headers and structure.`
  }

  /* ── Send message ── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    historyRef.current.push({ role: 'user', content: text })

    const lc             = ctxRef.current
    const systemPrompt   = buildSystemPrompt(lc)
    const trimmedHistory = historyRef.current.slice(-20).filter(m => m.content.trim() !== '')

    try {
      const response = await fetch('/api/ai-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ system: systemPrompt, messages: trimmedHistory }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error || `HTTP ${response.status}`)
      }

      const data  = await response.json()
      const reply = data?.content?.[0]?.text?.trim() || ''
      if (!reply) throw new Error('Empty reply from API')

      historyRef.current.push({ role: 'assistant', content: reply })
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }])

    } catch (err) {
      const errMsg = (err as Error)?.message || ''
      const city   = lc.city || 'your location'
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Could not reach AI server.**\n\nError: \`${errMsg}\`\n\nPlease check:\n1. \`GROQ_API_KEY\` is set in \`.env.local\`\n2. Dev server was restarted after adding the key\n\n**Emergency numbers for ${city}:**\n- 🚔 Police: **100**\n- 🚑 Ambulance: **108**\n- 🔥 Fire: **101**\n- 📞 National Emergency: **112**\n- 🧳 Tourist Helpline: **1363**`,
        timestamp: new Date().toISOString(),
      }])
    }

    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const clearChat = () => {
    historyRef.current = []
    setMessages(prev => prev.slice(0, 1))
  }

  const locationLabel = ctx.state ? `${ctx.city}, ${ctx.state}` : ctx.city || 'Detecting…'
  const statusColor   = locationStatus === 'gps'    ? '#10B981'
                      : locationStatus === 'ip'     ? '#F59E0B'
                      : locationStatus === 'denied' ? '#EF4444'
                      : '#94A3B8'
  const statusIcon    = locationStatus === 'gps'    ? '📍'
                      : locationStatus === 'ip'     ? '🌐'
                      : locationStatus === 'denied' ? '⚠️'
                      : '⏳'

  return (
    <div style={S.root}>
      <Sidebar />

      <div style={S.main}>
        {/* TopBar */}
        <div style={S.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={S.aiAvatar}>🤖</div>
            <div>
              <h1 style={S.tbTitle}>AI Safety Assistant</h1>
              <p style={S.tbSub}>
                Powered by Groq ·{' '}
                <span style={{ color: statusColor, fontWeight: 600 }}>
                  {statusIcon} {locationLabel}
                </span>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {ctx.tempC !== null && (
              <span style={{ ...S.pill, ...S.pillAmber }}>
                🌤 {ctx.tempC}°C · {ctx.weather}
              </span>
            )}
            <span style={{ ...S.pill, ...S.pillBlue }}>🕐 {ctx.time}</span>
            <button onClick={clearChat} style={S.clearBtn}>🗑 Clear</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Chat ── */}
          <div style={S.chatArea}>
            <div style={S.messagesList}>
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-end',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}>
                  <div style={{
                    ...S.msgAvatar,
                    background: msg.role === 'assistant'
                      ? 'linear-gradient(135deg,#3B82F6,#06B6D4)'
                      : 'linear-gradient(135deg,#8B5CF6,#6366F1)',
                  }}>
                    {msg.role === 'assistant' ? '🤖' : (user?.name?.[0]?.toUpperCase() ?? '👤')}
                  </div>
                  <div style={{
                    ...S.msgBubble,
                    maxWidth: '72%',
                    background:  msg.role === 'assistant' ? '#fff'    : '#EFF6FF',
                    border:      msg.role === 'assistant' ? '0.5px solid #E2E8F0' : '0.5px solid #BFDBFE',
                    borderBottomLeftRadius:  msg.role === 'assistant' ? 4  : 16,
                    borderBottomRightRadius: msg.role === 'user'      ? 4  : 16,
                  }}>
                    <div
                      style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                    />
                    <p style={S.msgTime}>{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ ...S.msgAvatar, background: 'linear-gradient(135deg,#3B82F6,#06B6D4)' }}>🤖</div>
                  <div style={{ ...S.msgBubble, background: '#fff', border: '0.5px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 7, height: 7, borderRadius: '50%', background: '#3B82F6',
                          animation: 'bounce 1.2s ease infinite',
                          animationDelay: `${i * 0.2}s`,
                        }} />
                      ))}
                      <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>
                        SafeTrail AI is thinking…
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Chips */}
            <div style={S.suggestBar}>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={S.chip}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLElement; b.style.background='#EFF6FF'; b.style.color='#1D4ED8'; b.style.borderColor='#93C5FD' }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLElement; b.style.background='#F8FAFC'; b.style.color='#475569'; b.style.borderColor='#E2E8F0' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div style={S.inputBar}>
              <div style={S.inputWrap}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKey}
                  placeholder={`Ask anything about ${ctx.city || 'your location'} — safety, food, places, transport…`}
                  rows={1}
                  style={S.textarea}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  style={{
                    ...S.sendBtn,
                    background: input.trim() && !loading ? '#2563EB' : '#E2E8F0',
                    color:      input.trim() && !loading ? '#fff'    : '#94A3B8',
                    cursor:     input.trim() && !loading ? 'pointer'  : 'not-allowed',
                  }}
                >↑</button>
              </div>
              <p style={{ fontSize: 10, color: '#CBD5E1', textAlign: 'center', margin: '6px 0 0' }}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div style={S.rightPanel}>

            {/* Location card */}
            <div style={S.ctxSection}>
              <p style={S.ctxLabel}>📍 Live Location</p>
              <div style={S.ctxCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>
                    {locationStatus === 'gps'    ? 'GPS · High Accuracy'
                   : locationStatus === 'ip'     ? 'IP Geolocation'
                   : locationStatus === 'denied' ? 'Default Location'
                   :                               'Detecting…'}
                  </span>
                </div>
                {[
                  { label: '🏙 City',     value: ctx.city  || '—' },
                  { label: '🗺 State',    value: ctx.state || '—' },
                  { label: '🌡 Temp',     value: ctx.tempC !== null ? `${ctx.tempC}°C` : '—' },
                  { label: '⛅ Weather',  value: ctx.weather },
                  { label: '💧 Humidity', value: ctx.humidity ? `${ctx.humidity}%` : '—' },
                  { label: '💨 Wind',     value: ctx.windKph ? `${ctx.windKph} km/h` : '—' },
                  { label: '🕐 Time',     value: `${ctx.time} (${ctx.timeOfDay})` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{label}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#334155', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {value}
                    </span>
                  </div>
                ))}
                {ctx.lat && (
                  <p style={{ fontSize: 9, color: '#CBD5E1', margin: '6px 0 0', fontFamily: 'monospace' }}>
                    {ctx.lat.toFixed(4)}, {ctx.lng?.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div style={S.ctxSection}>
              <p style={S.ctxLabel}>⚡ Quick Actions</p>
              {[
                { label: '🏥 Nearest Hospital',  q: `Nearest hospital to ${ctx.city}` },
                { label: '🚔 Police Station',     q: `Nearest police station in ${ctx.city}` },
                { label: '🍽 Best Local Food',    q: `Best local food in ${ctx.city} for tourists` },
                { label: '🚌 Transport Options',  q: `How to get around ${ctx.city} as a tourist` },
                { label: '🛡 Safety Overview',    q: `Is ${ctx.city} safe for tourists right now?` },
                { label: '🏛 Top Attractions',    q: `Top tourist attractions in and around ${ctx.city}` },
                { label: '💊 24hr Pharmacy',       q: `24-hour pharmacy near ${ctx.city}` },
                { label: '💰 ATMs & Money',        q: `ATMs and money exchange in ${ctx.city}` },
                { label: '🌿 Nature & Trekking',   q: `Nature spots and trekking near ${ctx.city}` },
                { label: '🗣 Local Phrases',       q: `Useful Marathi and Hindi phrases for tourists in ${ctx.city}` },
              ].map(({ label, q }) => (
                <button key={label} onClick={() => sendMessage(q)} style={S.quickBtn}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLElement; b.style.background='#EFF6FF'; b.style.color='#1D4ED8' }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLElement; b.style.background='#F8FAFC'; b.style.color='#334155' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Emergency */}
            <div style={S.emergencyStrip}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#BE123C', margin: '0 0 8px', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                🚨 Emergency Numbers
              </p>
              {[
                { name: 'National Emergency', num: '112'  },
                { name: 'Police',             num: '100'  },
                { name: 'Ambulance',          num: '108'  },
                { name: 'Tourist Helpline',   num: '1363' },
                { name: 'Women Helpline',     num: '1091' },
              ].map(({ name, num }) => (
                <a key={num} href={`tel:${num}`} style={S.emergencyRow}>
                  <span style={{ fontSize: 10, color: '#64748B' }}>{name}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', fontFamily: 'monospace' }}>{num}</span>
                </a>
              ))}
            </div>

            {/* Model badge */}
            <div style={{ padding: '10px 14px' }}>
              <p style={{ fontSize: 9, color: '#CBD5E1', margin: 0 }}>
                ⚡ <strong>Groq · llama-3.3-70b-versatile</strong><br />Conversations private · not stored
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,100% { transform:translateY(0);    opacity:0.5; }
          50%      { transform:translateY(-5px); opacity:1;   }
        }
        textarea:focus { border-color:#93C5FD !important; box-shadow:0 0 0 3px rgba(147,197,253,0.2); }
        ::-webkit-scrollbar       { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:4px; }
      `}</style>
    </div>
  )
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */
const S: Record<string, React.CSSProperties> = {
  root: { display:'flex', height:'100vh', overflow:'hidden', background:'#F8FAFC', fontFamily:"-apple-system,BlinkMacSystemFont,'Inter',sans-serif" },

  sidebar: { width:220, background:'#0F172A', display:'flex', flexDirection:'column', flexShrink:0, borderRight:'0.5px solid #1E293B' },
  sbBrand: { display:'flex', alignItems:'center', gap:10, padding:'20px 16px 16px', borderBottom:'0.5px solid #1E293B' },
  sbLogo:  { width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#3B82F6,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 },
  sbName:  { fontSize:13, fontWeight:700, color:'#F1F5F9', letterSpacing:'-0.2px', margin:0 },
  sbSub:   { fontSize:10, color:'#475569', margin:0 },
  sbNav:   { flex:1, overflowY:'auto', padding:'12px 8px', scrollbarWidth:'thin', scrollbarColor:'#1E293B transparent' },
  navLabel:{ fontSize:9, fontWeight:700, letterSpacing:2, color:'#334155', padding:'12px 8px 6px', textTransform:'uppercase', margin:0 },
  navItem: { display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, marginBottom:2, transition:'background 0.15s' },
  navIcon: { width:28, height:28, borderRadius:6, background:'#1E293B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 },
  navText: { fontSize:12, fontWeight:500 },
  navBadge:{ marginLeft:'auto', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:99, background:'#EF4444', color:'#fff' },
  sbFooter:{ padding:'12px 8px', borderTop:'0.5px solid #1E293B' },
  sbUser:  { display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer' },
  sbAvatar:{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3B82F6,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 },
  sbUname: { fontSize:11, fontWeight:600, color:'#CBD5E1', margin:0 },
  sbUrole: { fontSize:9, color:'#475569', margin:0 },

  main:    { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 },
  topbar:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', background:'#fff', borderBottom:'0.5px solid #E2E8F0', flexShrink:0 },
  aiAvatar:{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#3B82F6,#06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 },
  tbTitle: { fontSize:14, fontWeight:700, color:'#0F172A', letterSpacing:'-0.3px', margin:0 },
  tbSub:   { fontSize:11, color:'#64748B', margin:0 },
  pill:    { display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, padding:'4px 10px', borderRadius:99 },
  pillAmber:{ background:'#FFFBEB', color:'#D97706', border:'0.5px solid #FDE68A' },
  pillBlue: { background:'#EFF6FF', color:'#1D4ED8', border:'0.5px solid #BFDBFE' },
  clearBtn: { fontSize:11, fontWeight:600, padding:'5px 12px', borderRadius:8, background:'#F8FAFC', border:'0.5px solid #E2E8F0', color:'#64748B', cursor:'pointer' },

  chatArea:     { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 },
  messagesList: { flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16, scrollbarWidth:'thin', scrollbarColor:'#CBD5E1 transparent' },
  msgAvatar:    { width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0, color:'#fff' },
  msgBubble:    { padding:'12px 14px', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' },
  msgTime:      { fontSize:10, color:'#CBD5E1', margin:'6px 0 0', textAlign:'right' as const },

  suggestBar: { padding:'8px 20px 6px', borderTop:'0.5px solid #F1F5F9', background:'#fff', flexShrink:0 },
  chip: { flexShrink:0, fontSize:11, padding:'5px 12px', borderRadius:99, background:'#F8FAFC', border:'0.5px solid #E2E8F0', color:'#475569', cursor:'pointer', whiteSpace:'nowrap' as const, transition:'all 0.15s', fontWeight:500 },

  inputBar:  { padding:'12px 20px 14px', background:'#fff', borderTop:'0.5px solid #E2E8F0', flexShrink:0 },
  inputWrap: { display:'flex', gap:10, alignItems:'flex-end' },
  textarea:  { flex:1, resize:'none' as const, border:'0.5px solid #E2E8F0', borderRadius:12, padding:'10px 14px', fontSize:13, color:'#0F172A', background:'#F8FAFC', outline:'none', lineHeight:1.5, fontFamily:'inherit', scrollbarWidth:'none' as const, transition:'border-color 0.15s, box-shadow 0.15s', minHeight:44, maxHeight:120 },
  sendBtn:   { width:44, height:44, borderRadius:12, border:'none', fontSize:18, fontWeight:800, transition:'all 0.2s', flexShrink:0 },

  rightPanel: { width:264, flexShrink:0, display:'flex', flexDirection:'column', background:'#fff', borderLeft:'0.5px solid #E2E8F0', overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'#CBD5E1 transparent' },
  ctxSection: { padding:'14px 14px 10px', borderBottom:'0.5px solid #F1F5F9' },
  ctxLabel:   { fontSize:9, fontWeight:700, letterSpacing:2, color:'#94A3B8', textTransform:'uppercase', margin:'0 0 10px' },
  ctxCard:    { background:'#F8FAFC', borderRadius:10, padding:'10px 12px', border:'0.5px solid #E2E8F0' },

  quickBtn: { width:'100%', textAlign:'left' as const, padding:'7px 10px', borderRadius:8, fontSize:11, fontWeight:500, color:'#334155', background:'#F8FAFC', border:'0.5px solid #E2E8F0', cursor:'pointer', marginBottom:4, transition:'all 0.15s' },

  emergencyStrip: { padding:'12px 14px', borderBottom:'0.5px solid #F1F5F9', background:'#FFF1F2' },
  emergencyRow:   { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'0.5px solid #FECDD3', textDecoration:'none', cursor:'pointer' },
}

export default function AIPage() {
  return <AuthGuard><AIContent /></AuthGuard>
}