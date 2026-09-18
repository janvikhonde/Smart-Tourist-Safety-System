'use client'
import { useState, useEffect} from 'react'
import { useRouter } from 'next/navigation'
import { clearAuth, getUser } from '@/lib/auth'
import { tourGuidePlacesStore, TourGuidePlace, CAT_COLOR, SEASON_COLOR, DIFF_COLOR } from '@/lib/tourGuideStore'

const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter', 'All Year']
const CATEGORIES = ['Beach', 'Mountain', 'City', 'Forest', 'Desert', 'Cultural', 'Adventure', 'Wildlife']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD']
const DIFFICULTIES = ['Easy', 'Moderate', 'Challenging', 'Expert']
const TRANSPORT_OPTIONS = ['Flight', 'Flight + Train', 'Flight + Ferry', 'Flight + Bus', 'Train', 'Bus', 'Car', 'Multiple Modes']
const STATUS_STYLE: Record<string, any> = {
  Active: {
    bg: 'rgba(34,197,94,0.1)',
    color: '#4ade80',
    border: 'rgba(34,197,94,0.2)'
  },
  Inactive: {
    bg: 'rgba(100,116,139,0.1)',
    color: '#94a3b8',
    border: 'rgba(100,116,139,0.2)'
  },
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',     icon: '⊞' },
  { id: 'places',    label: 'Manage Places', icon: '📍' },
  { id: 'add',       label: 'Add New Place', icon: '＋' },
  { id: 'weather',   label: 'Weather Check', icon: '🌤' },
  { id: 'routes',    label: 'Routes & Maps', icon: '🧭' },
]

const FORM_TABS = [
  { id: 'basic',   label: '📋 Basic Info' },
  { id: 'details', label: '💰 Details & Media' },
  { id: 'tips',    label: '💡 Tips & Highlights' },
  { id: 'location',label: '📍 Location' },
]

const MOCK_WEATHER: Record<string, any> = {
  Paris:     { temp: 18, condition: 'Partly Cloudy', humidity: 65, wind: 12, uv: 3,  visibility: 10, forecast: [{ day:'Mon', icon:'⛅', high:18, low:12 }, { day:'Tue', icon:'🌧️', high:15, low:10 }, { day:'Wed', icon:'☀️', high:22, low:13 }, { day:'Thu', icon:'⛅', high:19, low:11 }] },
  Bali:      { temp: 29, condition: 'Sunny',         humidity: 78, wind: 8,  uv: 9,  visibility: 15, forecast: [{ day:'Mon', icon:'☀️', high:31, low:24 }, { day:'Tue', icon:'⛅', high:28, low:23 }, { day:'Wed', icon:'🌧️', high:26, low:22 }, { day:'Thu', icon:'☀️', high:30, low:24 }] },
  Tokyo:     { temp: 14, condition: 'Cloudy',        humidity: 55, wind: 15, uv: 4,  visibility: 8,  forecast: [{ day:'Mon', icon:'⛅', high:16, low:10 }, { day:'Tue', icon:'☀️', high:18, low:11 }, { day:'Wed', icon:'⛅', high:15, low:9  }, { day:'Thu', icon:'🌧️', high:12, low:8  }] },
  Santorini: { temp: 24, condition: 'Sunny',         humidity: 52, wind: 18, uv: 7,  visibility: 20, forecast: [{ day:'Mon', icon:'☀️', high:26, low:18 }, { day:'Tue', icon:'☀️', high:27, low:19 }, { day:'Wed', icon:'⛅', high:23, low:17 }, { day:'Thu', icon:'☀️', high:25, low:18 }] },
}

export default function TourGuidePage() {
  const router  = useRouter()
  const user    = getUser()
  const now     = new Date()

  const [activeNav,    setActiveNav]    = useState('dashboard')
  const [places,       setPlaces]       = useState<TourGuidePlace[]>([])
  const [selectedPlace,setSelectedPlace]= useState<TourGuidePlace | null>(null)
  const [editPlace,    setEditPlace]    = useState<TourGuidePlace | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterCat,    setFilterCat]    = useState('All')
  const [filterSeason, setFilterSeason] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [search,       setSearch]       = useState('')
  const [weatherCity,  setWeatherCity]  = useState('Bali')
  const [weatherData,  setWeatherData]  = useState<any>(MOCK_WEATHER['Bali'])
  const [routeFrom,    setRouteFrom]    = useState('')
  const [routeTo,      setRouteTo]      = useState('')
  const [toast,        setToast]        = useState<{ msg: string; type: string } | null>(null)
  const [activeFormTab,setActiveFormTab]= useState('basic')
  const [formErrors,   setFormErrors]   = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '', location: '', country: '', category: 'Beach', season: 'Summer',
    budget: '', currency: 'USD', days: '', transport: 'Flight',
    difficulty: 'Easy', image: '', description: '', tips: '', highlights: '',
    lat: '', lng: '', status: 'Active' as 'Active'  | 'Archived',
  })

  // Subscribe to shared store
  useEffect(() => {
    setPlaces(tourGuidePlacesStore.getAllPlaces())
    const unsub = tourGuidePlacesStore.subscribe(setPlaces)
    return unsub
  }, [])

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (formErrors[e.target.name]) setFormErrors({ ...formErrors, [e.target.name]: '' })
  }

  const addPlace = () => {
    const err: Record<string, string> = {}
    if (!form.name.trim())        err.name        = 'Required'
    if (!form.country.trim())     err.country     = 'Required'
    if (!form.location.trim())    err.location    = 'Required'
    if (!form.budget)             err.budget      = 'Required'
    if (!form.days)               err.days        = 'Required'
    if (!form.image.trim())       err.image       = 'Required'
    if (!form.description.trim()) err.description = 'Required'
    if (Object.keys(err).length) {
      setFormErrors(err)
      setActiveFormTab(err.budget || err.days || err.image ? 'details' : 'basic')
      return
    }
    const p = tourGuidePlacesStore.addPlace({
      ...form,
      lat: parseFloat(form.lat) || 0,
      lng: parseFloat(form.lng) || 0,
      rating: '0',
status: form.status === 'Active' ? 'Active' : 'Inactive',
    })
    setForm({ name:'', location:'', country:'', category:'Beach', season:'Summer', budget:'', currency:'USD', days:'', transport:'Flight', difficulty:'Easy', image:'', description:'', tips:'', highlights:'', lat:'', lng:'', status:'Active' })
    setFormErrors({})
    setActiveFormTab('basic')
    showToast(`✅ "${p.name}" added successfully — visible to tourists!`)
    setActiveNav('places')
  }

  const deletePlace = (id: string) => {
  const p = places.find(x => x.id === id)
  tourGuidePlacesStore.deletePlace(id, 'guide')
  setDeleteConfirm(null)
  if (selectedPlace?.id === id) setSelectedPlace(null)
  showToast(`🗑️ "${p?.name}" removed`, 'error')
}
  
  const saveEdit = () => {
    if (!editPlace) return
    tourGuidePlacesStore.updatePlace(editPlace.id, editPlace)
    setEditPlace(null)
    showToast('✅ Changes saved — tourists will see the update!')
  }

  const handleSignOut = () => {
    clearAuth()
    router.replace('/auth/login')
  }

  const filteredPlaces = places.filter(p =>
    (filterCat    === 'All' || p.category === filterCat) &&
    (filterSeason === 'All' || p.season   === filterSeason) &&
    (filterStatus === 'All' || p.status   === filterStatus) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.country.toLowerCase().includes(search.toLowerCase()) ||
     p.id.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = {
    total:  places.length,
    active: places.filter(p => p.status === 'Active').length,
    inactive:  places.filter(p => p.status === 'Inactive').length,
    views:  places.reduce((s, p) => s + (p.visitors ?? 0), 0),
  }

  return (
    <div style={{ display:'flex', height:'100vh', background:'#080f1d', color:'#b8cce0', fontFamily:"'DM Sans','Segoe UI',sans-serif", overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#1a3050;border-radius:4px;}
        .nav-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:9px;cursor:pointer;font-size:13.5px;font-weight:500;color:#4a6a8a;transition:all 0.15s;border-left:3px solid transparent;}
        .nav-item:hover{background:rgba(59,130,246,0.07);color:#8ab8d8;}
        .nav-active{background:rgba(59,130,246,0.12);color:#60a5fa;border-left-color:#3b82f6;}
        .glass{background:rgba(10,20,38,0.6);border:1px solid #132035;border-radius:13px;}
        .stat-card{background:linear-gradient(145deg,#0c1c32,#09162a);border:1px solid #132035;border-radius:13px;padding:20px 22px;transition:border-color 0.2s;}
        .stat-card:hover{border-color:#1e3a58;}
        .btn-primary{background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;border:none;border-radius:8px;padding:9px 18px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all 0.15s;}
        .btn-primary:hover{background:linear-gradient(135deg,#2563eb,#3b82f6);box-shadow:0 4px 14px rgba(37,99,235,0.3);}
        .btn-ghost{background:transparent;color:#4a6a8a;border:1px solid #1a3050;border-radius:8px;padding:8px 15px;cursor:pointer;font-size:13px;font-family:inherit;transition:all 0.15s;}
        .btn-ghost:hover{border-color:#3b82f6;color:#60a5fa;}
        .btn-danger{background:rgba(239,68,68,0.09);color:#f87171;border:1px solid rgba(239,68,68,0.18);border-radius:8px;padding:7px 13px;cursor:pointer;font-size:12.5px;font-family:inherit;transition:all 0.15s;}
        .btn-danger:hover{background:rgba(239,68,68,0.18);}
        .input-f{background:rgba(255,255,255,0.03);border:1px solid #182e48;border-radius:8px;padding:9px 12px;color:#c0d8ec;font-family:inherit;font-size:13.5px;width:100%;outline:none;transition:border 0.15s;}
        .input-f:focus{border-color:#3b82f6;background:rgba(59,130,246,0.04);}
        .input-f::placeholder{color:#243c54;}
        .input-f option{background:#0c1c32;}
        .lbl{display:block;font-size:10.5px;font-weight:700;color:#335570;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:5px;}
        .err{color:#f87171;font-size:11px;margin-top:3px;}
        .badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;}
        .tbl-row{display:grid;padding:11px 18px;border-bottom:1px solid #0d1e32;transition:background 0.1s;font-size:13px;align-items:center;}
        .tbl-row:hover{background:rgba(59,130,246,0.035);}
        .tbl-head{display:grid;padding:9px 18px;background:rgba(6,13,26,0.7);font-size:10.5px;font-weight:700;color:#2a4e68;letter-spacing:0.8px;text-transform:uppercase;}
        .toast{position:fixed;top:16px;right:20px;z-index:9999;padding:10px 16px;border-radius:9px;font-size:13px;font-weight:500;animation:toastIn 0.22s ease;box-shadow:0 4px 20px rgba(0,0,0,0.5);}
        .toast-success{background:#06180e;border:1px solid #14532d;color:#86efac;}
        .toast-error{background:#190707;border:1px solid #7f1d1d;color:#fca5a5;}
        @keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .overlay{position:fixed;inset:0;background:rgba(2,7,16,0.9);z-index:998;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);}
        .modal{background:#091627;border:1px solid #1a3050;border-radius:15px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto;}
        .fg{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .divider{height:1px;background:linear-gradient(90deg,transparent,#132035,transparent);margin:16px 0;}
        a{color:#60a5fa;text-decoration:none;}a:hover{text-decoration:underline;}
      `}</style>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="overlay">
          <div style={{ background:'#091627', border:'1px solid #1a3050', borderRadius:13, padding:28, maxWidth:360, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:38, marginBottom:14 }}>🗑️</div>
            <h3 style={{ color:'#ddeaf5', fontSize:16, fontWeight:700, marginBottom:8 }}>Remove Destination?</h3>
            <p style={{ color:'#4a6a8a', fontSize:13, lineHeight:1.6, marginBottom:22 }}>
              This will permanently remove <strong style={{ color:'#b8cce0' }}>{places.find(p => p.id === deleteConfirm)?.name}</strong> from your guide list and tourist view.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" style={{ padding:'9px 22px', fontSize:13 }} onClick={() => deletePlace(deleteConfirm)}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SIDEBAR ═══ */}
      <div style={{ width:208, background:'#050d1a', borderRight:'1px solid #0e1e30', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid #0e1e30' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🌍</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#ddeaf5', letterSpacing:'-0.3px' }}>WanderLog</div>
              <div style={{ fontSize:9.5, color:'#1e4060', fontWeight:700, letterSpacing:'1.2px' }}>GUIDE PANEL</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV_ITEMS.map(item => (
            <div key={item.id} className={`nav-item ${activeNav === item.id ? 'nav-active' : ''}`} onClick={() => setActiveNav(item.id)}>
              <span style={{ fontSize:15 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding:'12px 10px', borderTop:'1px solid #0e1e30' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 8px', borderRadius:9, background:'rgba(255,255,255,0.02)', marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? 'TG'}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#b8cce0' }}>{user?.name ?? 'Tour Guide'}</div>
              <div style={{ fontSize:9.5, color:'#1e4060', fontWeight:700, letterSpacing:'0.5px' }}>TOUR GUIDE</div>
            </div>
          </div>
          <div className="nav-item" style={{ color:'#f87171', fontSize:13 }} onClick={handleSignOut}>
            <span>⏻</span><span>Sign Out</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top Bar */}
        <div style={{ background:'#050d1a', borderBottom:'1px solid #0e1e30', padding:'12px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h1 style={{ fontSize:17, fontWeight:700, color:'#ddeaf5' }}>{NAV_ITEMS.find(n => n.id === activeNav)?.label}</h1>
            <p style={{ fontSize:11, color:'#223a52', marginTop:1 }}>
              {activeNav === 'dashboard' && 'Overview · Statistics · Quick Actions'}
              {activeNav === 'places'    && 'Browse, edit and manage all your destinations'}
              {activeNav === 'add'       && 'Add a destination — it appears live on tourist pages'}
              {activeNav === 'weather'   && 'Check live weather at any destination'}
              {activeNav === 'routes'    && 'Plan routes and open Google Maps directions'}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <input className="input-f" style={{ width:220, fontSize:13 }} placeholder="🔍  Search places…" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn-primary" onClick={() => setActiveNav('add')}>+ Add Place</button>
            <div style={{ textAlign:'right', minWidth:100 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#60a5fa', display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                {now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
              </div>
              <div style={{ fontSize:10.5, color:'#1e4060' }}>
                {now.toLocaleDateString('en-US', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:'auto', padding:'18px 22px' }}>

          {/* ─── DASHBOARD ─── */}
          {activeNav === 'dashboard' && (
            <div>
              {/* Live banner */}
              <div style={{ padding:'10px 16px', borderRadius:10, background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.15)', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:16 }}>🌍</span>
                <p style={{ fontSize:12.5, color:'#86efac' }}>
                  <strong>{stats.active} active destinations</strong> are currently visible to tourists on the Places page.
                  Add or activate more to help tourists discover new spots!
                </p>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18 }}>
                {[
                  { label:'Total Destinations', value:stats.total,                icon:'📍', accent:'#a78bfa' },
                  { label:'Active (visible)',    value:stats.active,               icon:'✅', accent:'#4ade80' },
                  { label:'Inactive',     value:stats.inactive,                icon:'📝', accent:'#fbbf24' },
                  { label:'Total Views',         value:stats.views.toLocaleString(),icon:'👁️', accent:'#60a5fa' },
                ].map((s, i) => (
                  <div key={i} className="stat-card" style={{ borderColor:s.accent+'33' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <p style={{ fontSize:10.5, color:'#2a4e68', fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:8 }}>{s.label}</p>
                        <p style={{ fontSize:32, fontWeight:700, color:'#ddeaf5', lineHeight:1 }}>{s.value}</p>
                      </div>
                      <div style={{ width:40, height:40, borderRadius:10, background:s.accent+'16', border:`1px solid ${s.accent}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{s.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:14, marginBottom:14 }}>
                <div className="glass" style={{ overflow:'hidden' }}>
                  <div style={{ padding:'13px 18px', borderBottom:'1px solid #0e1e30', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <p style={{ fontSize:13.5, fontWeight:700, color:'#b8cce0' }}>Recent Destinations</p>
                      <p style={{ fontSize:11, color:'#1e4060', marginTop:1 }}>Active ones appear on the tourist Places page</p>
                    </div>
                    <button className="btn-ghost" style={{ fontSize:12 }} onClick={() => setActiveNav('places')}>View All →</button>
                  </div>
                  <div className="tbl-head" style={{ gridTemplateColumns:'100px 1fr 100px 90px 110px' }}>
                    <span>ID</span><span>Name</span><span>Category</span><span>Season</span><span>Status</span>
                  </div>
                  {places.slice(0, 6).map(p => (
                    <div key={p.id} className="tbl-row" style={{ gridTemplateColumns:'100px 1fr 100px 90px 110px', cursor:'pointer' }} onClick={() => setSelectedPlace(p)}>
                      <span style={{ color:'#3b82f6', fontFamily:'DM Mono, monospace', fontSize:11.5 }}>{p.id}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <img src={p.image} alt="" style={{ width:28, height:28, borderRadius:6, objectFit:'cover', flexShrink:0 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                        <div>
                          <p style={{ color:'#b8cce0', fontWeight:600, fontSize:13 }}>{p.name}</p>
                          <p style={{ color:'#2a4e68', fontSize:11 }}>{p.country}</p>
                        </div>
                      </div>
                      <span><span className="badge" style={{ background:CAT_COLOR[p.category]+'18', color:CAT_COLOR[p.category], border:`1px solid ${CAT_COLOR[p.category]}28` }}>{p.category}</span></span>
                      <span><span className="badge" style={{ background:SEASON_COLOR[p.season]+'18', color:SEASON_COLOR[p.season], border:`1px solid ${SEASON_COLOR[p.season]}28` }}>{p.season}</span></span>
                      <span><span className="badge" style={{ background:STATUS_STYLE[p.status].bg, color:STATUS_STYLE[p.status].color, border:`1px solid ${STATUS_STYLE[p.status].border}` }}>● {p.status}</span></span>
                    </div>
                  ))}
                </div>

                <div className="glass" style={{ padding:18 }}>
                  <p style={{ fontSize:13.5, fontWeight:700, color:'#b8cce0', marginBottom:4 }}>By Category</p>
                  <p style={{ fontSize:11, color:'#1e4060', marginBottom:16 }}>Destination distribution</p>
                  {CATEGORIES.map(cat => {
                    const count = places.filter(p => p.category === cat).length
                    if (!count) return null
                    const pct = (count / places.length) * 100
                    return (
                      <div key={cat} style={{ marginBottom:11 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ fontSize:12.5, color:'#6a8aaa', display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ width:7, height:7, borderRadius:'50%', background:CAT_COLOR[cat], display:'inline-block' }} />{cat}
                          </span>
                          <span style={{ fontSize:12, color:'#3a608a', fontWeight:700 }}>{count}</span>
                        </div>
                        <div style={{ height:4, background:'rgba(255,255,255,0.04)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:CAT_COLOR[cat], borderRadius:2 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="glass" style={{ padding:16 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#b8cce0', marginBottom:12 }}>Quick Actions</p>
                <div style={{ display:'flex', gap:9 }}>
                  {[
                    { label:'➕ Add New Place', nav:'add',     primary:true  },
                    { label:'📋 All Places',    nav:'places',  primary:false },
                    { label:'🌤️ Weather',       nav:'weather', primary:false },
                    { label:'🧭 Routes',        nav:'routes',  primary:false },
                  ].map((a, i) => (
                    <button key={i} className={a.primary ? 'btn-primary' : 'btn-ghost'} onClick={() => setActiveNav(a.nav)}>{a.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── MANAGE PLACES ─── */}
          {activeNav === 'places' && (
            <div>
              <div className="glass" style={{ padding:'11px 14px', marginBottom:12, display:'flex', gap:9, alignItems:'center', flexWrap:'wrap' }}>
                {[
                  { val:filterCat,    set:setFilterCat,    opts:['All', ...CATEGORIES], label:'All Categories' },
                  { val:filterSeason, set:setFilterSeason, opts:['All', ...SEASONS],    label:'All Seasons'    },
                  { val:filterStatus, set:setFilterStatus, opts:['All','Active','Draft','Archived'], label:'All Status' },
                ].map((f, i) => (
                  <select key={i} className="input-f" value={f.val} onChange={e => f.set(e.target.value)} style={{ width:145 }}>
                    {f.opts.map(o => <option key={o}>{o === 'All' ? f.label : o}</option>)}
                  </select>
                ))}
                <span style={{ marginLeft:'auto', fontSize:12, color:'#2a4e68', fontWeight:600 }}>{filteredPlaces.length} results</span>
                <button className="btn-primary" onClick={() => setActiveNav('add')}>+ Add Place</button>
              </div>

              <div className="glass" style={{ overflow:'hidden' }}>
                <div className="tbl-head" style={{ gridTemplateColumns:'108px 1.6fr 100px 100px 90px 88px 108px 148px' }}>
                  <span>Place ID</span><span>Destination</span><span>Category</span><span>Season</span><span>Budget</span><span>Days</span><span>Status</span><span>Actions</span>
                </div>
                {filteredPlaces.length === 0 ? (
                  <div style={{ padding:'48px 20px', textAlign:'center' }}>
                    <p style={{ fontSize:36, marginBottom:10 }}>📭</p>
                    <p style={{ color:'#2a4e68', fontSize:14 }}>No destinations match your filters.</p>
                    <button className="btn-primary" style={{ marginTop:14 }} onClick={() => setActiveNav('add')}>Add First Place</button>
                  </div>
                ) : filteredPlaces.map(p => (
                  <div key={p.id} className="tbl-row" style={{ gridTemplateColumns:'108px 1.6fr 100px 100px 90px 88px 108px 148px' }}>
                    <span style={{ color:'#3b82f6', fontFamily:'DM Mono, monospace', fontSize:11.5 }}>{p.id}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setSelectedPlace(p)}>
                      <img src={p.image} alt="" style={{ width:34, height:34, borderRadius:7, objectFit:'cover', flexShrink:0 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      <div>
                        <p style={{ color:'#b8cce0', fontWeight:600, fontSize:13 }}>{p.name}</p>
                        <p style={{ color:'#2a4e68', fontSize:11 }}>📍 {p.location}, {p.country}</p>
                      </div>
                    </div>
                    <span><span className="badge" style={{ background:CAT_COLOR[p.category]+'18', color:CAT_COLOR[p.category], border:`1px solid ${CAT_COLOR[p.category]}28` }}>{p.category}</span></span>
                    <span><span className="badge" style={{ background:SEASON_COLOR[p.season]+'18', color:SEASON_COLOR[p.season], border:`1px solid ${SEASON_COLOR[p.season]}28` }}>{p.season}</span></span>
                    <span style={{ color:'#6a8aaa', fontSize:13 }}>{p.currency} {parseInt(p.budget).toLocaleString()}</span>
                    <span style={{ color:'#6a8aaa', fontSize:13 }}>{p.days}d</span>
                    <span><span className="badge" style={{ background:STATUS_STYLE[p.status].bg, color:STATUS_STYLE[p.status].color, border:`1px solid ${STATUS_STYLE[p.status].border}` }}>● {p.status}</span></span>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setSelectedPlace(p)}>View</button>
                      <button className="btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setEditPlace({ ...p })}>Edit</button>
                      <button className="btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setDeleteConfirm(p.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── ADD PLACE ─── */}
          {activeNav === 'add' && (
            <div style={{ maxWidth:820 }}>
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.15)', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:16 }}>💡</span>
                <p style={{ fontSize:12.5, color:'#7dd3fc' }}>Places set to <strong>Active</strong> will immediately appear in the tourist Places page under "Tour Guide Picks".</p>
              </div>

              <div className="glass" style={{ padding:'9px 12px', marginBottom:14, display:'flex', gap:5 }}>
                {FORM_TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveFormTab(t.id)} style={{ padding:'7px 16px', borderRadius:7, border:'none', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', background:activeFormTab === t.id ? '#0f2a45' : 'transparent', color:activeFormTab === t.id ? '#60a5fa' : '#3a5e7a' }}>{t.label}</button>
                ))}
              </div>

              <div className="glass" style={{ padding:28 }}>
                <div style={{ marginBottom:20 }}>
                  <h2 style={{ fontSize:16, fontWeight:700, color:'#ddeaf5' }}>
                    {activeFormTab === 'basic'    && 'Basic Information'}
                    {activeFormTab === 'details'  && 'Budget, Duration & Media'}
                    {activeFormTab === 'tips'     && 'Tips & Highlights'}
                    {activeFormTab === 'location' && 'Map Coordinates'}
                  </h2>
                  <p style={{ fontSize:11.5, color:'#1e4060', marginTop:3 }}>
                    {activeFormTab === 'basic'    && 'Core details about this destination'}
                    {activeFormTab === 'details'  && 'Budget estimates, duration, transport, and image'}
                    {activeFormTab === 'tips'     && 'Insider tips and highlights tourists will see'}
                    {activeFormTab === 'location' && 'Lat/lng coordinates for map directions'}
                  </p>
                </div>

                {activeFormTab === 'basic' && (
                  <div className="fg">
                    {[
                      { n:'name',     l:'Place Name *',       p:'e.g. Santorini' },
                      { n:'country',  l:'Country *',          p:'e.g. Greece'    },
                      { n:'location', l:'Specific Location *',p:'e.g. Santorini Island, Cyclades' },
                    ].map(f => (
                      <div key={f.n} style={f.n === 'location' ? { gridColumn:'1/-1' } : {}}>
                        <label className="lbl">{f.l}</label>
                        <input name={f.n} value={(form as any)[f.n]} onChange={handleChange} placeholder={f.p} className="input-f" />
                        {formErrors[f.n] && <p className="err">{formErrors[f.n]}</p>}
                      </div>
                    ))}
                    <div>
                      <label className="lbl">Category</label>
                      <select name="category" value={form.category} onChange={handleChange} className="input-f">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Best Season</label>
                      <select name="season" value={form.season} onChange={handleChange} className="input-f">
                        {SEASONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Difficulty</label>
                      <select name="difficulty" value={form.difficulty} onChange={handleChange} className="input-f">
                        {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Listing Status</label>
                      <select name="status" value={form.status} onChange={handleChange} className="input-f">
                        <option>Active</option><option>Draft</option><option>Archived</option>
                      </select>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label className="lbl">Description *</label>
                      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Write a compelling description for tourists..." rows={4} className="input-f" style={{ resize:'vertical' }} />
                      {formErrors.description && <p className="err">{formErrors.description}</p>}
                    </div>
                  </div>
                )}

                {activeFormTab === 'details' && (
                  <div className="fg">
                    <div>
                      <label className="lbl">Budget Estimate *</label>
                      <input name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. 2500" type="number" className="input-f" />
                      {formErrors.budget && <p className="err">{formErrors.budget}</p>}
                    </div>
                    <div>
                      <label className="lbl">Currency</label>
                      <select name="currency" value={form.currency} onChange={handleChange} className="input-f">
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Duration (Days) *</label>
                      <input name="days" value={form.days} onChange={handleChange} placeholder="e.g. 7" type="number" className="input-f" />
                      {formErrors.days && <p className="err">{formErrors.days}</p>}
                    </div>
                    <div>
                      <label className="lbl">Transport Mode</label>
                      <select name="transport" value={form.transport} onChange={handleChange} className="input-f">
                        {TRANSPORT_OPTIONS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label className="lbl">Image URL *</label>
                      <input name="image" value={form.image} onChange={handleChange} placeholder="https://images.unsplash.com/..." className="input-f" />
                      {formErrors.image && <p className="err">{formErrors.image}</p>}
                    </div>
                    {form.image && (
                      <div style={{ gridColumn:'1/-1' }}>
                        <label className="lbl">Preview</label>
                        <img src={form.image} alt="preview" style={{ width:'100%', height:180, objectFit:'cover', borderRadius:10, border:'1px solid #132035' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      </div>
                    )}
                  </div>
                )}

                {activeFormTab === 'tips' && (
                  <div className="fg">
                    <div style={{ gridColumn:'1/-1' }}>
                      <label className="lbl">Key Highlights</label>
                      <input name="highlights" value={form.highlights} onChange={handleChange} placeholder="e.g. Oia Sunset, Fira Town, Red Beach" className="input-f" />
                      <p style={{ fontSize:11, color:'#1e4060', marginTop:4 }}>Separate with commas — shown as tags to tourists</p>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label className="lbl">Travel Tips for Tourists</label>
                      <textarea name="tips" value={form.tips} onChange={handleChange} placeholder="Share insider tips — best time, what to avoid, must-do activities..." rows={6} className="input-f" style={{ resize:'vertical' }} />
                    </div>
                  </div>
                )}

                {activeFormTab === 'location' && (
                  <div className="fg">
                    <div>
                      <label className="lbl">Latitude</label>
                      <input name="lat" value={form.lat} onChange={handleChange} placeholder="e.g. 36.3932" type="number" className="input-f" />
                    </div>
                    <div>
                      <label className="lbl">Longitude</label>
                      <input name="lng" value={form.lng} onChange={handleChange} placeholder="e.g. 25.4615" type="number" className="input-f" />
                    </div>
                    <div style={{ gridColumn:'1/-1', padding:14, background:'rgba(59,130,246,0.04)', border:'1px solid rgba(59,130,246,0.1)', borderRadius:9 }}>
                      <p style={{ fontSize:12.5, color:'#4a7090', lineHeight:1.7 }}>
                        💡 Find coordinates on <a href="https://maps.google.com" target="_blank">Google Maps</a> → right-click → copy lat/lng. These power the Get Directions button tourists see.
                      </p>
                    </div>
                    {form.lat && form.lng && (
                      <div style={{ gridColumn:'1/-1' }}>
                        <button className="btn-ghost" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${form.lat},${form.lng}`, '_blank')}>🗺️ Preview on Google Maps</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="divider" />
                <div style={{ display:'flex', gap:9, alignItems:'center', flexWrap:'wrap' }}>
                  <button className="btn-primary" onClick={addPlace} style={{ padding:'10px 26px', fontSize:14 }}>✈️ Save Destination</button>
                  {activeFormTab !== 'basic' && (
                    <button className="btn-ghost" onClick={() => { const t=['basic','details','tips','location']; setActiveFormTab(t[t.indexOf(activeFormTab)-1]) }}>← Back</button>
                  )}
                  {activeFormTab !== 'location' && (
                    <button className="btn-ghost" onClick={() => { const t=['basic','details','tips','location']; setActiveFormTab(t[t.indexOf(activeFormTab)+1]) }}>Next →</button>
                  )}
                  <button className="btn-ghost" style={{ marginLeft:'auto' }} onClick={() => { setForm({ name:'',location:'',country:'',category:'Beach',season:'Summer',budget:'',currency:'USD',days:'',transport:'Flight',difficulty:'Easy',image:'',description:'',tips:'',highlights:'',lat:'',lng:'',status:'Active' }); setFormErrors({}); setActiveFormTab('basic') }}>Clear</button>
                </div>
              </div>
            </div>
          )}

          {/* ─── WEATHER ─── */}
          {activeNav === 'weather' && (
            <div style={{ maxWidth:680 }}>
              <div className="glass" style={{ padding:22, marginBottom:14 }}>
                <p style={{ fontSize:13.5, fontWeight:700, color:'#b8cce0', marginBottom:12 }}>Check Destination Weather</p>
                <div style={{ display:'flex', gap:9, marginBottom:10 }}>
                  <input className="input-f" value={weatherCity} onChange={e => setWeatherCity(e.target.value)} placeholder="Enter city name…" style={{ flex:1 }}
                    onKeyDown={e => e.key === 'Enter' && (setWeatherData(MOCK_WEATHER[weatherCity] || MOCK_WEATHER['Paris']), showToast(`🌤️ Weather loaded for ${weatherCity}`))} />
                  <button className="btn-primary" onClick={() => { setWeatherData(MOCK_WEATHER[weatherCity] || MOCK_WEATHER['Paris']); showToast(`🌤️ Weather loaded for ${weatherCity}`) }}>Check</button>
                </div>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  {['Paris','Bali','Tokyo','Santorini'].map(c => (
                    <button key={c} className="btn-ghost" style={{ fontSize:12, padding:'5px 12px' }} onClick={() => { setWeatherCity(c); setWeatherData(MOCK_WEATHER[c]) }}>{c}</button>
                  ))}
                </div>
              </div>
              {weatherData && (
                <>
                  <div className="glass" style={{ padding:22, marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <h2 style={{ fontSize:22, fontWeight:700, color:'#ddeaf5' }}>{weatherCity}</h2>
                        <p style={{ fontSize:13, color:'#2a4e68', marginTop:3 }}>{weatherData.condition}</p>
                      </div>
                      <p style={{ fontSize:54, fontWeight:700, color:'#60a5fa', lineHeight:1 }}>{weatherData.temp}°C</p>
                    </div>
                    <div className="divider" />
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                      {[{ l:'Humidity', v:`${weatherData.humidity}%`, i:'💧' }, { l:'Wind', v:`${weatherData.wind} km/h`, i:'💨' }, { l:'UV Index', v:weatherData.uv, i:'☀️' }, { l:'Visibility', v:`${weatherData.visibility} km`, i:'👁️' }].map((d, i) => (
                        <div key={i} style={{ padding:'11px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid #0e1e30', borderRadius:9 }}>
                          <p style={{ fontSize:10.5, color:'#1e4060', fontWeight:700, letterSpacing:'0.5px', marginBottom:5 }}>{d.i} {d.l}</p>
                          <p style={{ fontSize:18, fontWeight:700, color:'#b8cce0' }}>{d.v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass" style={{ padding:18 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#b8cce0', marginBottom:14 }}>4-Day Forecast</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                      {weatherData.forecast?.map((d: any, i: number) => (
                        <div key={i} style={{ padding:'16px 10px', background:'rgba(255,255,255,0.02)', border:'1px solid #0e1e30', borderRadius:9, textAlign:'center' }}>
                          <p style={{ fontSize:11, color:'#2a4e68', fontWeight:700, marginBottom:8 }}>{d.day}</p>
                          <p style={{ fontSize:28, marginBottom:8 }}>{d.icon}</p>
                          <p style={{ fontSize:16, fontWeight:700, color:'#60a5fa' }}>{d.high}°</p>
                          <p style={{ fontSize:12, color:'#1e4060' }}>{d.low}°</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── ROUTES ─── */}
          {activeNav === 'routes' && (
            <div style={{ maxWidth:800 }}>
              <div className="glass" style={{ padding:22, marginBottom:14 }}>
                <p style={{ fontSize:13.5, fontWeight:700, color:'#b8cce0', marginBottom:4 }}>Plan a Route</p>
                <p style={{ fontSize:11.5, color:'#1e4060', marginBottom:16 }}>Enter origin and destination to open Google Maps</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13, marginBottom:13 }}>
                  <div>
                    <label className="lbl">From (Origin)</label>
                    <input className="input-f" value={routeFrom} onChange={e => setRouteFrom(e.target.value)} placeholder="e.g. Mumbai, India" />
                  </div>
                  <div>
                    <label className="lbl">To (Destination)</label>
                    <input className="input-f" value={routeTo} onChange={e => setRouteTo(e.target.value)} placeholder="e.g. Santorini, Greece" />
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[{ l:'🚗 Driving', m:'driving' }, { l:'🚆 Transit', m:'transit' }, { l:'🚶 Walking', m:'walking' }, { l:'🚲 Cycling', m:'bicycling' }].map(x => (
                    <button key={x.m} className="btn-ghost" onClick={() => {
                      if (!routeFrom || !routeTo) { showToast('Enter both From and To first', 'error'); return }
                      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeFrom)}&destination=${encodeURIComponent(routeTo)}&travelmode=${x.m}`, '_blank')
                    }}>{x.l}</button>
                  ))}
                </div>
              </div>

              <div className="glass" style={{ overflow:'hidden' }}>
                <div style={{ padding:'13px 18px', borderBottom:'1px solid #0e1e30' }}>
                  <p style={{ fontSize:13.5, fontWeight:700, color:'#b8cce0' }}>Saved Destinations — Quick Directions</p>
                </div>
                <div className="tbl-head" style={{ gridTemplateColumns:'108px 1fr 110px 80px 1fr 150px' }}>
                  <span>ID</span><span>Destination</span><span>Transport</span><span>Days</span><span>Coordinates</span><span>Actions</span>
                </div>
                {places.map(p => (
                  <div key={p.id} className="tbl-row" style={{ gridTemplateColumns:'108px 1fr 110px 80px 1fr 150px' }}>
                    <span style={{ color:'#3b82f6', fontFamily:'DM Mono, monospace', fontSize:11.5 }}>{p.id}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <img src={p.image} alt="" style={{ width:30, height:30, borderRadius:6, objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      <div>
                        <p style={{ color:'#b8cce0', fontWeight:600, fontSize:13 }}>{p.name}</p>
                        <p style={{ color:'#2a4e68', fontSize:11 }}>{p.country}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:12, color:'#6a8aaa' }}>{p.transport}</span>
                    <span style={{ fontSize:13, color:'#6a8aaa' }}>{p.days}d</span>
                    <span style={{ fontSize:11.5, color:'#2a4e68', fontFamily:'DM Mono, monospace' }}>{p.lat ? `${p.lat.toFixed(2)}, ${p.lng.toFixed(2)}` : '—'}</span>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="btn-ghost" style={{ fontSize:11.5, padding:'5px 10px' }} onClick={() => p.lat && window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, '_blank')}>🧭 Dir</button>
                      <button className="btn-ghost" style={{ fontSize:11.5, padding:'5px 10px' }} onClick={() => p.lat && window.open(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`, '_blank')}>🗺️ Map</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ VIEW MODAL ═══ */}
      {selectedPlace && (
        <div className="overlay" onClick={() => setSelectedPlace(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ position:'relative', height:220, borderRadius:'15px 15px 0 0', overflow:'hidden' }}>
              <img src={selectedPlace.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(6,14,26,0.95) 0%,transparent 55%)' }} />
              <button onClick={() => setSelectedPlace(null)} style={{ position:'absolute', top:13, right:13, background:'rgba(0,0,0,0.55)', color:'#b8cce0', border:'1px solid #1a3050', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
              <div style={{ position:'absolute', bottom:0, left:0, padding:20 }}>
                <div style={{ display:'flex', gap:6, marginBottom:7 }}>
                  <span className="badge" style={{ background:CAT_COLOR[selectedPlace.category]+'22', color:CAT_COLOR[selectedPlace.category], border:`1px solid ${CAT_COLOR[selectedPlace.category]}35` }}>{selectedPlace.category}</span>
                  <span className="badge" style={{ background:SEASON_COLOR[selectedPlace.season]+'22', color:SEASON_COLOR[selectedPlace.season], border:`1px solid ${SEASON_COLOR[selectedPlace.season]}35` }}>{selectedPlace.season}</span>
                  <span className="badge" style={{ background:STATUS_STYLE[selectedPlace.status].bg, color:STATUS_STYLE[selectedPlace.status].color, border:`1px solid ${STATUS_STYLE[selectedPlace.status].border}` }}>● {selectedPlace.status}</span>
                </div>
                <h2 style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{selectedPlace.name}</h2>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12.5 }}>📍 {selectedPlace.location}, {selectedPlace.country} · {selectedPlace.id} · ⭐ {selectedPlace.rating}</p>
              </div>
            </div>
            <div style={{ padding:22 }}>
              <p style={{ color:'#6a8aaa', fontSize:13.5, lineHeight:1.7, marginBottom:18 }}>{selectedPlace.description}</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginBottom:16 }}>
                {[
                  { l:'Budget',    v:`${selectedPlace.currency} ${parseInt(selectedPlace.budget).toLocaleString()}` },
                  { l:'Duration',  v:`${selectedPlace.days} days` },
                  { l:'Transport', v:selectedPlace.transport },
                  { l:'Difficulty',v:selectedPlace.difficulty, color:DIFF_COLOR[selectedPlace.difficulty] },
                  { l:'Best Season',v:selectedPlace.season },
                  { l:'Total Views',
v: (selectedPlace.visitors ?? 0).toLocaleString() },
                ].map((d, i) => (
                  <div key={i} style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid #0e1e30', borderRadius:8 }}>
                    <p style={{ fontSize:10, color:'#1e4060', fontWeight:700, letterSpacing:'0.6px', marginBottom:4 }}>{d.l.toUpperCase()}</p>
                    <p style={{ fontSize:13.5, fontWeight:600, color:(d as any).color || '#b8cce0' }}>{d.v}</p>
                  </div>
                ))}
              </div>
              {selectedPlace.highlights && (
                <div style={{ padding:13, background:'rgba(59,130,246,0.04)', border:'1px solid rgba(59,130,246,0.1)', borderRadius:9, marginBottom:12 }}>
                  <p style={{ fontSize:10.5, fontWeight:700, color:'#3b82f6', letterSpacing:'0.6px', marginBottom:9 }}>KEY HIGHLIGHTS</p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {selectedPlace.highlights.split(',').map((h, i) => (
                      <span key={i} className="badge" style={{ background:'rgba(96,165,250,0.08)', color:'#60a5fa', border:'1px solid rgba(96,165,250,0.15)', fontSize:12 }}>{h.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedPlace.tips && (
                <div style={{ padding:13, background:'rgba(251,191,36,0.04)', border:'1px solid rgba(251,191,36,0.1)', borderRadius:9, marginBottom:18 }}>
                  <p style={{ fontSize:10.5, fontWeight:700, color:'#fbbf24', letterSpacing:'0.6px', marginBottom:7 }}>💡 TRAVEL TIPS</p>
                  <p style={{ fontSize:13, color:'#6a8aaa', lineHeight:1.65 }}>{selectedPlace.tips}</p>
                </div>
              )}
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-primary" onClick={() => selectedPlace.lat && window.open(`https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`, '_blank')}>🗺️ View on Map</button>
                <button className="btn-ghost" onClick={() => selectedPlace.lat && window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`, '_blank')}>🧭 Directions</button>
                <button className="btn-ghost" onClick={() => { setEditPlace({ ...selectedPlace }); setSelectedPlace(null) }}>✏️ Edit</button>
                <button className="btn-danger" onClick={() => { setSelectedPlace(null); setDeleteConfirm(selectedPlace.id) }}>🗑️ Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {editPlace && (
        <div className="overlay" onClick={() => setEditPlace(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 22px', borderBottom:'1px solid #0e1e30', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#ddeaf5' }}>Edit — {editPlace.name}</h3>
                <p style={{ fontSize:11, color:'#1e4060', marginTop:2 }}>{editPlace.id}</p>
              </div>
              <button onClick={() => setEditPlace(null)} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid #182e48', color:'#4a6a8a', borderRadius:7, width:28, height:28, cursor:'pointer', fontSize:16 }}>×</button>
            </div>
            <div style={{ padding:22 }}>
              <div className="fg" style={{ marginBottom:14 }}>
                {[{ k:'name', l:'Place Name' }, { k:'country', l:'Country' }, { k:'location', l:'Location' }, { k:'budget', l:'Budget', t:'number' }, { k:'days', l:'Days', t:'number' }, { k:'transport', l:'Transport' }].map(f => (
                  <div key={f.k}>
                    <label className="lbl">{f.l}</label>
                    <input type={f.t || 'text'} value={(editPlace as any)[f.k]} onChange={e => setEditPlace({ ...editPlace, [f.k]: e.target.value })} className="input-f" />
                  </div>
                ))}
                {[{ k:'category', l:'Category', opts:CATEGORIES }, { k:'season', l:'Season', opts:SEASONS }, { k:'difficulty', l:'Difficulty', opts:DIFFICULTIES }, { k:'status', l:'Status', opts:['Active','Archived'] }].map(f => (
                  <div key={f.k}>
                    <label className="lbl">{f.l}</label>
                    <select value={(editPlace as any)[f.k]} onChange={e => setEditPlace({ ...editPlace, [f.k]: e.target.value })} className="input-f">
                      {f.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="lbl">Description</label>
                  <textarea value={editPlace.description} onChange={e => setEditPlace({ ...editPlace, description: e.target.value })} rows={3} className="input-f" style={{ resize:'vertical' }} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="lbl">Tips</label>
                  <textarea value={editPlace.tips} onChange={e => setEditPlace({ ...editPlace, tips: e.target.value })} rows={2} className="input-f" style={{ resize:'vertical' }} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="lbl">Highlights (comma-separated)</label>
                  <input value={editPlace.highlights} onChange={e => setEditPlace({ ...editPlace, highlights: e.target.value })} className="input-f" />
                </div>
              </div>
              <div style={{ display:'flex', gap:9 }}>
                <button className="btn-primary" onClick={saveEdit}>💾 Save Changes</button>
                <button className="btn-ghost" onClick={() => setEditPlace(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}