'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/layout/AuthGuard'
import { getUser, clearAuth } from '@/lib/auth'
import {
  tourGuidePlacesStore,
  TourGuidePlace,
  CAT_COLOR,
  SEASON_COLOR,
  SEASON_MONTHS,
  DIFF_COLOR,
} from '@/lib/tourGuideStore'

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES        = ['Heritage','Beach','Mountain','Wildlife','Spiritual','Adventure','City','Hill','Desert','Backwater','Nature']
const SEASONS           = ['Winter','Summer','Monsoon','Autumn','Spring','Year-round']
const DIFFICULTIES      = ['Easy','Moderate','Hard','Expert']
const TRANSPORT_OPTIONS = ['Road','Train','Flight','Flight + Train','Train + Road','Bus','Multiple Modes']

// ─── Tour Guide Add-Place Key ─────────────────────────────────────────────────
// Change this to any secret key you want to distribute to your tour guides.
// Guides must enter this key once per session before they can add destinations.
const GUIDE_ADD_KEY = 'SAFETRAIL-GUIDE-2025'

const GUIDE_NAV = [
  { id: 'dashboard', label: 'Dashboard',       icon: '🏠' },
  { id: 'add',       label: 'Add Destination', icon: '➕' },
  { id: 'myplaces',  label: 'My Places',       icon: '📋' },
  { id: 'tourpicks', label: 'Tour Picks Page', icon: '🗺️' },
  { id: 'weather',   label: 'Weather',         icon: '⛅' },
]

const EMPTY_FORM = {
  name:'', location:'', category:'Heritage', season:'Winter',
  difficulty:'Easy', budget:'', days:'', transport:'Train',
  rating:'4.5', image:'', description:'', highlights:'', tips:'',
  lat:'', lng:'', status:'Active' as 'Active' | 'Inactive',
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Plus Jakarta Sans','Segoe UI',sans-serif;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#1e3a52;border-radius:4px;}

  .g-nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;
    cursor:pointer;font-size:13px;font-weight:500;color:#5a8aaa;
    transition:all 0.15s;margin-bottom:2px;}
  .g-nav-item:hover{background:rgba(16,185,129,0.08);color:#6ee7b7;}
  .g-nav-active{background:rgba(16,185,129,0.13)!important;color:#10b981!important;font-weight:600!important;}

  .g-card{background:#0b1929;border:1px solid #142840;border-radius:14px;overflow:hidden;}
  .g-input{width:100%;background:rgba(255,255,255,0.03);border:1px solid #1a3550;
    border-radius:9px;padding:9px 12px;color:#c8dff0;
    font-family:inherit;font-size:13px;outline:none;transition:border 0.15s;}
  .g-input:focus{border-color:#10b981;}
  .g-input::placeholder{color:#1e3a52;}
  .g-input option{background:#0c1c30;color:#c8dff0;}

  .g-btn-primary{background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;
    border-radius:9px;padding:10px 22px;cursor:pointer;font-size:13px;font-weight:700;
    font-family:inherit;transition:all 0.15s;box-shadow:0 4px 14px rgba(16,185,129,0.2);}
  .g-btn-primary:hover{opacity:0.88;}
  .g-btn-ghost{background:transparent;color:#3a6a8a;border:1px solid #142840;
    border-radius:9px;padding:8px 16px;cursor:pointer;font-size:13px;
    font-family:inherit;transition:all 0.15s;}
  .g-btn-ghost:hover{border-color:#10b981;color:#10b981;}
  .g-btn-danger{background:rgba(239,68,68,0.08);color:#f87171;
    border:1px solid rgba(239,68,68,0.18);border-radius:8px;
    padding:6px 12px;cursor:pointer;font-size:12px;font-family:inherit;}
  .g-btn-danger:hover{background:rgba(239,68,68,0.16);}

  .g-badge{display:inline-flex;align-items:center;padding:3px 9px;
    border-radius:20px;font-size:11px;font-weight:600;}
  .g-tbl-row{display:grid;padding:11px 16px;border-bottom:1px solid #0c1e30;
    font-size:13px;align-items:center;transition:background 0.1s;}
  .g-tbl-row:hover{background:rgba(16,185,129,0.03);}
  .g-tbl-head{display:grid;padding:9px 16px;background:rgba(5,12,22,0.7);
    font-size:10px;font-weight:700;color:#1e4060;
    letter-spacing:0.8px;text-transform:uppercase;}

  .g-stat{background:linear-gradient(145deg,#0b1929,#081422);
    border:1px solid #142840;border-radius:14px;padding:18px 20px;}
  .g-toast{position:fixed;top:16px;right:20px;z-index:9999;padding:10px 18px;
    border-radius:10px;font-size:13px;font-weight:500;
    box-shadow:0 4px 24px rgba(0,0,0,0.5);animation:toastIn 0.2s ease;}
  .g-toast-ok{background:#061a0e;border:1px solid #14532d;color:#86efac;}
  .g-toast-err{background:#190707;border:1px solid #7f1d1d;color:#fca5a5;}
  .g-toast-warn{background:#1a1200;border:1px solid #78350f;color:#fcd34d;}
  @keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}

  .g-overlay{position:fixed;inset:0;background:rgba(2,7,16,0.93);z-index:998;
    display:flex;align-items:center;justify-content:center;padding:20px;
    backdrop-filter:blur(10px);}
  .g-modal{background:#091627;border:1px solid #142840;border-radius:16px;
    width:100%;max-width:700px;max-height:92vh;overflow-y:auto;}
  .g-lbl{display:block;font-size:10px;font-weight:700;color:#2a5070;
    letter-spacing:0.8px;text-transform:uppercase;margin-bottom:5px;}
  .g-err{color:#f87171;font-size:11px;margin-top:3px;}
  .g-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .g-full{grid-column:1/-1;}
  .g-divider{height:1px;background:linear-gradient(90deg,transparent,#132035,transparent);margin:18px 0;}
  .g-progress-bar{height:4px;background:rgba(255,255,255,0.04);border-radius:2px;overflow:hidden;}
  .g-form-tab{padding:7px 15px;border-radius:8px;border:none;font-size:12px;
    font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s;}

  /* Key gate animations */
  .key-gate{animation:fadeSlideUp 0.3s ease;}
  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .key-shake{animation:shake 0.35s ease;}
  @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
  .key-unlock{animation:unlockPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275);}
  @keyframes unlockPop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
`

// ─── Key Gate Modal ───────────────────────────────────────────────────────────
function KeyGateModal({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel:  () => void
}) {
  const [keyInput,  setKeyInput]  = useState('')
  const [error,     setError]     = useState('')
  const [shake,     setShake]     = useState(false)
  const [unlocked,  setUnlocked]  = useState(false)
  const [showKey,   setShowKey]   = useState(false)

  const handleSubmit = () => {
    if (keyInput.trim() === GUIDE_ADD_KEY) {
      setError('')
      setUnlocked(true)
      setTimeout(onSuccess, 900)
    } else {
      setError('Invalid key. Please check with your administrator.')
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }
  }

  return (
    <div className="g-overlay">
      <div
        className={`key-gate ${shake ? 'key-shake' : ''}`}
        style={{
          background:'#091627', border:'1px solid #142840', borderRadius:18,
          padding:36, maxWidth:420, width:'100%', textAlign:'center',
        }}
      >
        {unlocked ? (
          <div className="key-unlock">
            <div style={{ fontSize:56, marginBottom:14 }}>🔓</div>
            <h3 style={{ color:'#34d399', fontSize:18, fontWeight:800, marginBottom:8 }}>Access Granted!</h3>
            <p style={{ color:'#2a5a7a', fontSize:13 }}>Opening destination form…</p>
          </div>
        ) : (
          <>
            <div style={{
              width:64, height:64, borderRadius:18, margin:'0 auto 18px',
              background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
            }}>🔑</div>
            <h3 style={{ color:'#d4eaf8', fontSize:17, fontWeight:800, marginBottom:8 }}>
              Tour Guide Access Key
            </h3>
            <p style={{ color:'#2a5070', fontSize:13, lineHeight:1.65, marginBottom:24 }}>
              Enter your assigned guide key to unlock the <strong style={{ color:'#a8c8e0' }}>Add Destination</strong> feature.
              Contact your admin if you don't have a key.
            </p>

            <div style={{ position:'relative', marginBottom:error ? 8 : 20 }}>
              <input
                className="g-input"
                type={showKey ? 'text' : 'password'}
                placeholder="Enter your guide key…"
                value={keyInput}
                onChange={e => { setKeyInput(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  textAlign:'center', letterSpacing:'0.1em', fontSize:14, fontWeight:600,
                  paddingRight:44,
                  borderColor: error ? 'rgba(239,68,68,0.5)' : undefined,
                }}
                autoFocus
              />
              <button
                onClick={() => setShowKey(v => !v)}
                style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#2a5070',
                  padding:0,
                }}
                tabIndex={-1}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>

            {error && (
              <p style={{ color:'#f87171', fontSize:12, marginBottom:16, textAlign:'left', padding:'8px 12px', background:'rgba(239,68,68,0.07)', borderRadius:7, border:'1px solid rgba(239,68,68,0.15)' }}>
                ⚠️ {error}
              </p>
            )}

            <div style={{ display:'flex', gap:9, justifyContent:'center' }}>
              <button className="g-btn-ghost" onClick={onCancel}>Cancel</button>
              <button
                className="g-btn-primary"
                onClick={handleSubmit}
                style={{ minWidth:130 }}
              >
                🔑 Unlock
              </button>
            </div>

            <p style={{ fontSize:11, color:'#0f2a3a', marginTop:18 }}>
              🔒 Your key is never stored — re-enter each session.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Add Place Section ────────────────────────────────────────────────────────
function AddPlaceSection({
  guideUsername,
  onSaved,
}: {
  guideUsername: string
  onSaved: (name: string) => void
}) {
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [formTab,   setFormTab]   = useState('basic')
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const handle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())        e.name        = 'Required'
    if (!form.location.trim())    e.location    = 'Required'
    if (!form.description.trim()) e.description = 'Required'
    if (!form.budget)             e.budget      = 'Required'
    if (!form.days)               e.days        = 'Required'
    if (!form.image.trim())       e.image       = 'Required'
    if (!form.lat)                e.lat         = 'Required'
    if (!form.lng)                e.lng         = 'Required'
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      if (e.budget || e.days || e.image) setFormTab('details')
      else if (e.lat || e.lng)           setFormTab('location')
      else                               setFormTab('basic')
      return
    }
    tourGuidePlacesStore.addPlace({
      ...form,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      addedBy: guideUsername,
    })
    const name = form.name
    setForm(EMPTY_FORM)
    setErrors({})
    setFormTab('basic')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
    onSaved(name)
  }

  const TABS = [
    { id: 'basic',    label: '📋 Basic Info'      },
    { id: 'details',  label: '💰 Details & Media' },
    { id: 'tips',     label: '💡 Tips'            },
    { id: 'location', label: '📍 Location'        },
  ]

  return (
    <div>
      {submitted && (
        <div style={{ padding:'12px 16px', borderRadius:10, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>✅</span>
          <p style={{ fontSize:13, color:'#6ee7b7', margin:0 }}>
            Destination saved! It's now <strong>live on the Tour Picks page</strong> for tourists.
          </p>
        </div>
      )}

      <div style={{ padding:'11px 16px', borderRadius:10, background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.15)', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:16 }}>🇮🇳</span>
        <p style={{ fontSize:12.5, color:'#34d399', margin:0 }}>
          Destinations set to <strong>Active</strong> immediately appear on the tourist-facing Tour Picks page.
          Country locked to India · Currency locked to ₹
        </p>
      </div>

      {/* Tab bar */}
      <div className="g-card" style={{ padding:'10px 12px', marginBottom:14, display:'flex', gap:5, flexWrap:'wrap' as const }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className="g-form-tab"
            onClick={() => setFormTab(t.id)}
            style={{
              background: formTab === t.id ? '#0d2a3f' : 'transparent',
              color:      formTab === t.id ? '#10b981' : '#2a5070',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="g-card" style={{ padding:26 }}>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#d4eaf8' }}>
            {formTab === 'basic'    && 'Basic Information'}
            {formTab === 'details'  && 'Budget, Duration & Media'}
            {formTab === 'tips'     && 'Tips & Highlights'}
            {formTab === 'location' && 'Map Coordinates'}
          </h2>
          <p style={{ fontSize:11.5, color:'#1a3a52', marginTop:3 }}>
            {formTab === 'basic'    && 'Core details about this destination'}
            {formTab === 'details'  && 'Budget estimates, duration, transport and cover image'}
            {formTab === 'tips'     && 'Insider tips and highlights tourists will see on the card'}
            {formTab === 'location' && 'Lat/lng for the Get Directions button tourists tap'}
          </p>
        </div>

        {/* ── Basic ── */}
        {formTab === 'basic' && (
          <div className="g-grid2">
            <div>
              <label className="g-lbl">Place Name *</label>
              <input name="name" value={form.name} onChange={handle} placeholder="e.g. Hampi" className="g-input" />
              {errors.name && <p className="g-err">{errors.name}</p>}
            </div>
            <div>
              <label className="g-lbl">Location (City, State) *</label>
              <input name="location" value={form.location} onChange={handle} placeholder="e.g. Hampi, Karnataka" className="g-input" />
              {errors.location && <p className="g-err">{errors.location}</p>}
            </div>
            <div>
              <label className="g-lbl">Category</label>
              <select name="category" value={form.category} onChange={handle} className="g-input">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="g-lbl">Best Season</label>
              <select name="season" value={form.season} onChange={handle} className="g-input">
                {SEASONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="g-lbl">Difficulty</label>
              <select name="difficulty" value={form.difficulty} onChange={handle} className="g-input">
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="g-lbl">Listing Status</label>
              <select name="status" value={form.status} onChange={handle} className="g-input">
                <option value="Active">Active — visible to tourists</option>
                <option value="Inactive">Inactive — hidden</option>
              </select>
            </div>
            <div className="g-full">
              <label className="g-lbl">Description *</label>
              <textarea name="description" value={form.description} onChange={handle}
                placeholder="Write a compelling description tourists will see…"
                rows={4} className="g-input" style={{ resize:'vertical' }} />
              {errors.description && <p className="g-err">{errors.description}</p>}
            </div>
          </div>
        )}

        {/* ── Details ── */}
        {formTab === 'details' && (
          <div className="g-grid2">
            <div>
              <label className="g-lbl">Budget (₹) *</label>
              <input name="budget" type="number" value={form.budget} onChange={handle} placeholder="e.g. 8000" className="g-input" />
              {errors.budget && <p className="g-err">{errors.budget}</p>}
            </div>
            <div>
              <label className="g-lbl">Duration (Days) *</label>
              <input name="days" type="number" value={form.days} onChange={handle} placeholder="e.g. 3" className="g-input" />
              {errors.days && <p className="g-err">{errors.days}</p>}
            </div>
            <div>
              <label className="g-lbl">Transport Mode</label>
              <select name="transport" value={form.transport} onChange={handle} className="g-input">
                {TRANSPORT_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="g-lbl">Rating (1–5)</label>
              <input name="rating" type="number" min="1" max="5" step="0.1" value={form.rating} onChange={handle} placeholder="4.5" className="g-input" />
            </div>
            <div className="g-full">
              <label className="g-lbl">Cover Image URL *</label>
              <input name="image" value={form.image} onChange={handle} placeholder="https://images.unsplash.com/…" className="g-input" />
              {errors.image && <p className="g-err">{errors.image}</p>}
            </div>
            {form.image && (
              <div className="g-full">
                <label className="g-lbl">Image Preview</label>
                <img src={form.image} alt="preview"
                  style={{ width:'100%', height:180, objectFit:'cover', borderRadius:10, border:'1px solid #132035' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
          </div>
        )}

        {/* ── Tips ── */}
        {formTab === 'tips' && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <label className="g-lbl">Key Highlights (comma-separated)</label>
              <input name="highlights" value={form.highlights} onChange={handle}
                placeholder="e.g. Virupaksha Temple, Stone Chariot, Lotus Mahal" className="g-input" />
              <p style={{ fontSize:11, color:'#1a3a52', marginTop:5 }}>Shown as tags on tourist-facing Tour Picks cards</p>
            </div>
            <div>
              <label className="g-lbl">Travel Tips for Tourists</label>
              <textarea name="tips" value={form.tips} onChange={handle}
                placeholder="Share insider knowledge — best time of day, what to carry, what to avoid…"
                rows={7} className="g-input" style={{ resize:'vertical' }} />
            </div>
          </div>
        )}

        {/* ── Location ── */}
        {formTab === 'location' && (
          <div className="g-grid2">
            <div>
              <label className="g-lbl">Latitude *</label>
              <input name="lat" type="number" value={form.lat} onChange={handle} placeholder="e.g. 15.3350" className="g-input" />
              {errors.lat && <p className="g-err">{errors.lat}</p>}
            </div>
            <div>
              <label className="g-lbl">Longitude *</label>
              <input name="lng" type="number" value={form.lng} onChange={handle} placeholder="e.g. 76.4600" className="g-input" />
              {errors.lng && <p className="g-err">{errors.lng}</p>}
            </div>
            <div className="g-full" style={{ padding:13, background:'rgba(16,185,129,0.04)', border:'1px solid rgba(16,185,129,0.1)', borderRadius:9 }}>
              <p style={{ fontSize:12.5, color:'#047857', lineHeight:1.7 }}>
                💡 Open{' '}
                <a href="https://maps.google.com" target="_blank" style={{ color:'#10b981' }}>Google Maps</a>
                {' '}→ right-click any point → "Copy coordinates" to get lat and lng.
              </p>
            </div>
            {form.lat && form.lng && (
              <div className="g-full">
                <button className="g-btn-ghost"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${form.lat},${form.lng}`, '_blank')}>
                  🗺️ Preview on Google Maps
                </button>
              </div>
            )}
          </div>
        )}

        <div className="g-divider" />

        <div style={{ display:'flex', gap:9, alignItems:'center', flexWrap:'wrap' as const }}>
          <button className="g-btn-primary" onClick={handleSave} style={{ padding:'11px 28px', fontSize:14 }}>
            🇮🇳 Save Destination
          </button>
          {formTab !== 'basic' && (
            <button className="g-btn-ghost" onClick={() => {
              const t = ['basic', 'details', 'tips', 'location']
              setFormTab(t[t.indexOf(formTab) - 1])
            }}>← Back</button>
          )}
          {formTab !== 'location' && (
            <button className="g-btn-ghost" onClick={() => {
              const t = ['basic', 'details', 'tips', 'location']
              setFormTab(t[t.indexOf(formTab) + 1])
            }}>Next →</button>
          )}
          <button className="g-btn-ghost" style={{ marginLeft:'auto' }}
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setFormTab('basic') }}>
            Clear Form
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Guide Dashboard ─────────────────────────────────────────────────────
function GuideDashboard() {
  const router    = useRouter()
  const user      = getUser()
  const guideUser = user?.name || user?.email || 'guide'
  const now       = new Date()

  const [section,      setSection]      = useState('dashboard')
  const [allPlaces,    setAllPlaces]    = useState<TourGuidePlace[]>([])
  const [viewPlace,    setViewPlace]    = useState<TourGuidePlace | null>(null)
  const [deleteId,     setDeleteId]     = useState<string | null>(null)
  const [toast,        setToast]        = useState<{ msg: string; type: string } | null>(null)
  const [searchQ,      setSearchQ]      = useState('')
  const [filterCat,    setFilterCat]    = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  // ── Key gate state ──
  // 'locked'   = key not entered yet
  // 'verifying'= modal open, waiting for input
  // 'unlocked' = verified, show form
  const [keyState,     setKeyState]     = useState<'locked' | 'verifying' | 'unlocked'>('locked')
  const [pendingNav,   setPendingNav]   = useState<string | null>(null)

  useEffect(() => {
    tourGuidePlacesStore.init()
    setAllPlaces(tourGuidePlacesStore.getAllPlaces())
    return tourGuidePlacesStore.subscribe(setAllPlaces)
  }, [])

  // Reset key lock on sign-out (key is session-only, not persisted)
  useEffect(() => {
    return () => setKeyState('locked')
  }, [])

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Navigate to 'add' section — requires key
  const navigateToAdd = (fromNav = false) => {
    if (keyState === 'unlocked') {
      setSection('add')
    } else {
      setPendingNav('add')
      setKeyState('verifying')
    }
  }

  const handleKeySuccess = () => {
    setKeyState('unlocked')
    setKeyState('unlocked')
    setTimeout(() => {
      setKeyState('unlocked')
      setSection(pendingNav || 'add')
      setPendingNav(null)
      showToast('🔑 Key verified — Add Destination unlocked for this session!', 'success')
    }, 950)
  }

  const handleKeyCancel = () => {
    setKeyState('locked')
    setPendingNav(null)
  }

  const myPlaces = allPlaces.filter(p => p.addedBy === guideUser)
  const myActive = myPlaces.filter(p => p.status === 'Active')

  const filteredPlaces = myPlaces.filter(p =>
    (filterCat    === 'All' || p.category === filterCat) &&
    (filterStatus === 'All' || p.status   === filterStatus) &&
    (p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
     p.location.toLowerCase().includes(searchQ.toLowerCase())),
  )

  const handleDelete = (id: string) => {
    const p = allPlaces.find(x => x.id === id)
    tourGuidePlacesStore.deletePlace(id, 'guide')
    setDeleteId(null)
    setViewPlace(null)
    showToast(`🗑️ "${p?.name}" removed`, 'error')
  }

  const initials = (user?.name ?? 'TG')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ display:'flex', height:'100vh', background:'#060e1c', color:'#a8c8e0', fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif", overflow:'hidden' }}>
      <style>{css}</style>

      {/* ── Key Gate Modal ── */}
      {keyState === 'verifying' && (
        <KeyGateModal onSuccess={handleKeySuccess} onCancel={handleKeyCancel} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`g-toast ${toast.type === 'error' ? 'g-toast-err' : toast.type === 'warn' ? 'g-toast-warn' : 'g-toast-ok'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="g-overlay">
          <div style={{ background:'#081525', border:'1px solid #142840', borderRadius:14, padding:30, maxWidth:360, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:42, marginBottom:14 }}>🗑️</div>
            <h3 style={{ color:'#d4eaf8', fontSize:16, fontWeight:700, marginBottom:8 }}>Remove Destination?</h3>
            <p style={{ color:'#3a6a8a', fontSize:13, lineHeight:1.65, marginBottom:22 }}>
              This will permanently remove{' '}
              <strong style={{ color:'#a8c8e0' }}>{allPlaces.find(p => p.id === deleteId)?.name}</strong> from Tour Picks.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="g-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="g-btn-danger" style={{ padding:'9px 22px', fontSize:13 }}
                onClick={() => handleDelete(deleteId)}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {viewPlace && (() => {
        const catColor = CAT_COLOR[viewPlace.category] || '#10b981'
        return (
          <div className="g-overlay" onClick={() => setViewPlace(null)}>
            <div className="g-modal" onClick={e => e.stopPropagation()}>
              <div style={{ position:'relative', height:210, borderRadius:'16px 16px 0 0', overflow:'hidden' }}>
                <img src={viewPlace.image} alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(6,14,26,0.95) 0%,transparent 55%)' }} />
                <button onClick={() => setViewPlace(null)}
                  style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.5)', color:'#a8c8e0', border:'1px solid #142840', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontSize:16 }}>×</button>
                <div style={{ position:'absolute', bottom:0, left:0, padding:18 }}>
                  <span className="g-badge" style={{ background:catColor+'22', color:catColor, border:`1px solid ${catColor}35`, marginBottom:7 }}>{viewPlace.category}</span>
                  <h2 style={{ fontSize:20, fontWeight:700, color:'#fff', margin:'6px 0 3px' }}>{viewPlace.name}</h2>
                  <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12 }}>📍 {viewPlace.location} · 🇮🇳 India · ⭐ {viewPlace.rating}</p>
                </div>
              </div>
              <div style={{ padding:20 }}>
                <p style={{ color:'#5a8aaa', fontSize:13, lineHeight:1.7, marginBottom:16 }}>{viewPlace.description}</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
                  {[
                    { l:'Budget',     v:`₹ ${parseInt(viewPlace.budget).toLocaleString()}` },
                    { l:'Duration',   v:`${viewPlace.days} days` },
                    { l:'Transport',  v:viewPlace.transport },
                    { l:'Difficulty', v:viewPlace.difficulty, color:DIFF_COLOR[viewPlace.difficulty] },
                    { l:'Season',     v:viewPlace.season },
                    { l:'Best Months',v:SEASON_MONTHS[viewPlace.season] },
                  ].map((d, i) => (
                    <div key={i} style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid #0e1e30', borderRadius:8 }}>
                      <p style={{ fontSize:9, color:'#1a3a52', fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:4 }}>{d.l}</p>
                      <p style={{ fontSize:13, fontWeight:600, color:(d as any).color || '#a8c8e0', margin:0 }}>{d.v}</p>
                    </div>
                  ))}
                </div>
                {viewPlace.highlights && (
                  <div style={{ padding:12, background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.12)', borderRadius:9, marginBottom:10 }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'#10b981', letterSpacing:'0.6px', marginBottom:8 }}>KEY HIGHLIGHTS</p>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {viewPlace.highlights.split(',').map((h, i) => (
                        <span key={i} className="g-badge"
                          style={{ background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.2)', fontSize:11 }}>
                          {h.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {viewPlace.tips && (
                  <div style={{ padding:12, background:'rgba(251,191,36,0.04)', border:'1px solid rgba(251,191,36,0.1)', borderRadius:9, marginBottom:16 }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'#fbbf24', letterSpacing:'0.6px', marginBottom:6 }}>💡 TRAVEL TIPS</p>
                    <p style={{ fontSize:13, color:'#5a8aaa', lineHeight:1.65, margin:0 }}>{viewPlace.tips}</p>
                  </div>
                )}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
                  {viewPlace.lat && (
                    <>
                      <button className="g-btn-primary"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${viewPlace.lat},${viewPlace.lng}`, '_blank')}>
                        🗺️ View on Map
                      </button>
                      <button className="g-btn-ghost"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${viewPlace.lat},${viewPlace.lng}`, '_blank')}>
                        🧭 Directions
                      </button>
                    </>
                  )}
                  <button className="g-btn-ghost" onClick={() => { setViewPlace(null); navigateToAdd() }}>✏️ Edit</button>
                  <button className="g-btn-danger" onClick={() => { setDeleteId(viewPlace.id); setViewPlace(null) }}>🗑️ Remove</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ════ SIDEBAR ════ */}
      <div style={{ width:215, background:'#040c18', borderRight:'1px solid #0c1e30', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid #0c1e30', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 4px 12px rgba(16,185,129,0.3)' }}>🗺️</div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:'#d4eaf8', letterSpacing:'-0.3px' }}>SafeTrail</div>
            <div style={{ fontSize:9, color:'#10b981', fontWeight:700, letterSpacing:'1.5px' }}>TOUR GUIDE</div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column' }}>
          <p style={{ fontSize:9, fontWeight:700, letterSpacing:2, color:'#10b981', padding:'10px 8px 5px', textTransform:'uppercase' as const }}>Guide Tools</p>
          {GUIDE_NAV.map(item => (
            <div
              key={item.id}
              className={`g-nav-item ${section === item.id ? 'g-nav-active' : ''}`}
              onClick={() => {
                if (item.id === 'tourpicks') { router.push('/tour-picks'); return }
                if (item.id === 'weather')   { router.push('/weather');    return }
                // ── Add Destination requires key ──
                if (item.id === 'add') { navigateToAdd(true); return }
                setSection(item.id)
              }}
            >
              <span style={{ fontSize:15 }}>{item.icon}</span>
              <span>{item.label}</span>
              {/* Lock indicator on Add nav item when key not unlocked */}
              {item.id === 'add' && keyState !== 'unlocked' && (
                <span style={{ marginLeft:'auto', fontSize:11, opacity:0.5 }}>🔒</span>
              )}
              {item.id === 'add' && keyState === 'unlocked' && (
                <span style={{ marginLeft:'auto', fontSize:11 }}>🔓</span>
              )}
            </div>
          ))}

          <div style={{ height:1, background:'#0c1e30', margin:'10px 4px' }} />

          <p style={{ fontSize:9, fontWeight:700, letterSpacing:2, color:'#1a3a52', padding:'6px 8px 5px', textTransform:'uppercase' as const }}>Account</p>
          <div className="g-nav-item" onClick={() => router.push('/profile')}>
            <span style={{ fontSize:15 }}>👤</span><span>My Profile</span>
          </div>
          <div className="g-nav-item" onClick={() => router.push('/settings')}>
            <span style={{ fontSize:15 }}>⚙️</span><span>Settings</span>
          </div>
        </nav>

        <div style={{ padding:'12px 10px', borderTop:'1px solid #0c1e30' }}>
          <div style={{ padding:'5px 8px', borderRadius:8, background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.15)', marginBottom:8 }}>
            <p style={{ fontSize:9, color:'#10b981', fontWeight:700, letterSpacing:1, margin:0 }}>🗺️ TOUR GUIDE MODE</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'#a8c8e0' }}>{user?.name ?? 'Tour Guide'}</div>
              <div style={{ fontSize:9, color:'#1a3a52' }}>Active</div>
            </div>
          </div>
          <div className="g-nav-item" style={{ color:'#f87171', fontSize:13, marginTop:4 }}
            onClick={() => { clearAuth(); router.replace('/auth/login') }}>
            <span>⏻</span><span>Sign Out</span>
          </div>
        </div>
      </div>

      {/* ════ MAIN AREA ════ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Top bar */}
        <div style={{ background:'#040c18', borderBottom:'1px solid #0c1e30', padding:'12px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h1 style={{ fontSize:17, fontWeight:700, color:'#d4eaf8' }}>
              {section === 'dashboard' && 'Tour Guide Dashboard'}
              {section === 'add'       && 'Add New Destination'}
              {section === 'myplaces'  && 'My Places'}
            </h1>
            <p style={{ fontSize:11, color:'#142840', marginTop:1 }}>
              {section === 'dashboard' && 'Overview of your destinations & activity'}
              {section === 'add'       && 'Add an Indian destination — set to Active to go live on Tour Picks'}
              {section === 'myplaces'  && 'View, preview and manage your added destinations'}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <input
              className="g-input"
              style={{ width:210, fontSize:13 }}
              placeholder="🔍 Search my places…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {/* Add Destination button always prompts key if locked */}
            <button className="g-btn-primary" onClick={() => navigateToAdd()}>
              {keyState === 'unlocked' ? '➕' : '🔑'} Add Destination
            </button>
            <div style={{ textAlign:'right', minWidth:90 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#10b981', display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                {now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
              </div>
              <div style={{ fontSize:10, color:'#142840' }}>
                {now.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', scrollbarWidth:'thin', scrollbarColor:'#1e293b transparent' }}>

          {/* ─── DASHBOARD ─── */}
          {section === 'dashboard' && (
            <div>
              <div style={{ padding:'20px 24px', borderRadius:16, marginBottom:20, background:'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))', border:'1px solid rgba(16,185,129,0.2)', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', right:-10, top:-10, fontSize:100, opacity:0.05, userSelect:'none' }}>🗺️</div>
                <p style={{ fontSize:10, fontWeight:700, color:'#10b981', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>🇮🇳 Tour Guide Portal</p>
                <h2 style={{ fontSize:22, fontWeight:800, color:'#d4eaf8', marginBottom:6 }}>
                  Welcome back, {user?.name ?? 'Guide'} 👋
                </h2>
                <p style={{ fontSize:13, color:'#2a5a7a', lineHeight:1.65, maxWidth:520 }}>
                  Add <strong style={{ color:'#a0c8dc' }}>Indian destinations</strong> as Tour Picks visible to tourists.
                  Active picks help tourists discover amazing places across India.
                </p>
                <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' as const }}>
                  <button className="g-btn-primary" onClick={() => navigateToAdd()}>
                    {keyState === 'unlocked' ? '➕' : '🔑'} Add New Destination
                  </button>
                  <button className="g-btn-ghost" onClick={() => router.push('/tour-picks')}>🗺️ Tourist View →</button>
                </div>
              </div>

              {/* Key status banner */}
              <div style={{
                padding:'11px 16px', borderRadius:10, marginBottom:18,
                background: keyState === 'unlocked'
                  ? 'rgba(16,185,129,0.06)' : 'rgba(251,191,36,0.05)',
                border: `1px solid ${keyState === 'unlocked' ? 'rgba(16,185,129,0.18)' : 'rgba(251,191,36,0.18)'}`,
                display:'flex', alignItems:'center', gap:12,
              }}>
                <span style={{ fontSize:20 }}>{keyState === 'unlocked' ? '🔓' : '🔒'}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12.5, fontWeight:700, color: keyState === 'unlocked' ? '#34d399' : '#fbbf24', margin:'0 0 2px' }}>
                    {keyState === 'unlocked' ? 'Add Destination — Unlocked this session' : 'Add Destination — Requires Guide Key'}
                  </p>
                  <p style={{ fontSize:11.5, color:'#1a3a52', margin:0 }}>
                    {keyState === 'unlocked'
                      ? 'You can freely add destinations until you sign out.'
                      : 'Click "Add Destination" and enter your guide key to unlock. Contact your admin if you need one.'}
                  </p>
                </div>
                {keyState !== 'unlocked' && (
                  <button className="g-btn-ghost" style={{ fontSize:12, flexShrink:0 }} onClick={() => navigateToAdd()}>
                    🔑 Enter Key
                  </button>
                )}
              </div>

              {/* Stats — guide-only, no admin data */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
                {[
                  { label:'Added by You',     value:myPlaces.length,               icon:'✍️',  accent:'#10b981' },
                  { label:'Active (live)',     value:myActive.length,               icon:'✅',  accent:'#34d399' },
                  { label:'Inactive (hidden)', value:myPlaces.length - myActive.length, icon:'🔒', accent:'#64748b' },
                ].map((s, i) => (
                  <div key={i} className="g-stat" style={{ borderColor:s.accent+'30' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <p style={{ fontSize:9.5, color:'#1a3a52', fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:8 }}>{s.label}</p>
                        <p style={{ fontSize:34, fontWeight:800, color:'#d4eaf8', lineHeight:1 }}>{s.value}</p>
                      </div>
                      <div style={{ width:40, height:40, borderRadius:10, background:s.accent+'18', border:`1px solid ${s.accent}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{s.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 290px', gap:14 }}>
                {/* Recent table */}
                <div className="g-card">
                  <div style={{ padding:'13px 18px', borderBottom:'1px solid #0c1e30', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <p style={{ fontSize:13.5, fontWeight:700, color:'#a8c8e0', margin:0 }}>Your Recent Destinations</p>
                      <p style={{ fontSize:11, color:'#142840', marginTop:1 }}>Click a row to preview · Active ones appear on Tour Picks</p>
                    </div>
                    <button className="g-btn-ghost" style={{ fontSize:12 }} onClick={() => setSection('myplaces')}>View All →</button>
                  </div>
                  <div className="g-tbl-head" style={{ gridTemplateColumns:'1.8fr 100px 90px 70px' }}>
                    <span>Destination</span><span>Category</span><span>Season</span><span>Status</span>
                  </div>
                  {myPlaces.length === 0 ? (
                    <div style={{ padding:'50px 20px', textAlign:'center' }}>
                      <p style={{ fontSize:38, marginBottom:10 }}>🗺️</p>
                      <p style={{ color:'#1a3a52', fontSize:13, marginBottom:14 }}>No destinations added yet.</p>
                      <button className="g-btn-primary" onClick={() => navigateToAdd()}>🔑 Add Your First Destination</button>
                    </div>
                  ) : myPlaces.slice(0, 7).map(p => {
                    const cc = CAT_COLOR[p.category] || '#10b981'
                    const sc = SEASON_COLOR[p.season]  || '#64748b'
                    const isActive = p.status === 'Active'
                    return (
                      <div key={p.id} className="g-tbl-row"
                        style={{ gridTemplateColumns:'1.8fr 100px 90px 70px', cursor:'pointer' }}
                        onClick={() => setViewPlace(p)}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <img src={p.image} alt=""
                            style={{ width:32, height:32, borderRadius:7, objectFit:'cover', flexShrink:0 }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <div>
                            <p style={{ color:'#a8c8e0', fontWeight:600, fontSize:13 }}>{p.name}</p>
                            <p style={{ color:'#1a3a52', fontSize:11 }}>📍 {p.location}</p>
                          </div>
                        </div>
                        <span><span className="g-badge" style={{ background:cc+'18', color:cc, border:`1px solid ${cc}28` }}>{p.category}</span></span>
                        <span><span className="g-badge" style={{ background:sc+'18', color:sc, border:`1px solid ${sc}28` }}>{p.season}</span></span>
                        <span>
                          <span className="g-badge" style={{ background:isActive ? 'rgba(16,185,129,0.1)':'rgba(100,116,139,0.1)', color:isActive ? '#34d399':'#64748b', border:`1px solid ${isActive ? 'rgba(16,185,129,0.2)':'rgba(100,116,139,0.2)'}` }}>
                            ● {p.status}
                          </span>
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Right column */}
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div className="g-card" style={{ padding:18 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#a8c8e0', marginBottom:4 }}>By Category</p>
                    <p style={{ fontSize:11, color:'#142840', marginBottom:14 }}>Your destination distribution</p>
                    {myPlaces.length === 0 ? (
                      <p style={{ color:'#1a3a52', fontSize:12, textAlign:'center' }}>No data yet</p>
                    ) : CATEGORIES.map(cat => {
                      const count = myPlaces.filter(p => p.category === cat).length
                      if (!count) return null
                      const pct   = (count / myPlaces.length) * 100
                      const color = CAT_COLOR[cat] || '#10b981'
                      return (
                        <div key={cat} style={{ marginBottom:12 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                            <span style={{ fontSize:12, color:'#5a8aaa', display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ width:7, height:7, borderRadius:'50%', background:color, display:'inline-block' }} />{cat}
                            </span>
                            <span style={{ fontSize:12, color:'#2a5a7a', fontWeight:700 }}>{count}</span>
                          </div>
                          <div className="g-progress-bar">
                            <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="g-card" style={{ padding:18 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#a8c8e0', marginBottom:12 }}>Quick Actions</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <button className="g-btn-primary" style={{ width:'100%', textAlign:'left' as const }} onClick={() => navigateToAdd()}>
                        {keyState === 'unlocked' ? '➕' : '🔑'} Add New Destination
                      </button>
                      <button className="g-btn-ghost"   style={{ width:'100%', textAlign:'left' as const }} onClick={() => setSection('myplaces')}>📋 View My Places</button>
                      <button className="g-btn-ghost"   style={{ width:'100%', textAlign:'left' as const }} onClick={() => router.push('/tour-picks')}>🗺️ Open Tourist Page</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── ADD DESTINATION (key-gated) ─── */}
          {section === 'add' && (
            <div style={{ maxWidth:820 }}>
              {keyState === 'unlocked' ? (
                <AddPlaceSection
                  guideUsername={guideUser}
                  onSaved={name => showToast(`✅ "${name}" is now live on Tour Picks!`)}
                />
              ) : (
                // Fallback if somehow reached without key
                <div style={{ padding:'60px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:60, marginBottom:18 }}>🔒</div>
                  <h3 style={{ color:'#d4eaf8', fontSize:18, fontWeight:700, marginBottom:10 }}>Guide Key Required</h3>
                  <p style={{ color:'#2a5070', fontSize:13, marginBottom:22 }}>
                    You need your guide key to access Add Destination.
                  </p>
                  <button className="g-btn-primary" onClick={() => navigateToAdd()}>🔑 Enter Guide Key</button>
                </div>
              )}
            </div>
          )}

          {/* ─── MY PLACES ─── */}
          {section === 'myplaces' && (
            <div>
              <div className="g-card" style={{ padding:'11px 14px', marginBottom:12, display:'flex', gap:9, alignItems:'center', flexWrap:'wrap' as const }}>
                <select className="g-input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width:150 }}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select className="g-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width:140 }}>
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <span style={{ marginLeft:'auto', fontSize:12, color:'#1a3a52', fontWeight:600 }}>
                  {filteredPlaces.length} result{filteredPlaces.length !== 1 ? 's' : ''}
                </span>
                <button className="g-btn-primary" onClick={() => navigateToAdd()}>
                  {keyState === 'unlocked' ? '➕' : '🔑'} Add Destination
                </button>
              </div>

              <div className="g-card">
                <div className="g-tbl-head" style={{ gridTemplateColumns:'1.8fr 105px 95px 95px 75px 75px 135px' }}>
                  <span>Destination</span><span>Category</span><span>Season</span><span>Budget</span><span>Days</span><span>Status</span><span>Actions</span>
                </div>
                {filteredPlaces.length === 0 ? (
                  <div style={{ padding:'50px 20px', textAlign:'center' }}>
                    <p style={{ fontSize:38, marginBottom:10 }}>📭</p>
                    <p style={{ color:'#1a3a52', fontSize:13, marginBottom:14 }}>
                      {myPlaces.length === 0 ? "You haven't added any destinations yet." : 'No destinations match your filters.'}
                    </p>
                    <button className="g-btn-primary" onClick={() => navigateToAdd()}>🔑 Add Your First Destination</button>
                  </div>
                ) : filteredPlaces.map(p => {
                  const cc = CAT_COLOR[p.category] || '#10b981'
                  const sc = SEASON_COLOR[p.season]  || '#64748b'
                  const isActive = p.status === 'Active'
                  return (
                    <div key={p.id} className="g-tbl-row" style={{ gridTemplateColumns:'1.8fr 105px 95px 95px 75px 75px 135px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setViewPlace(p)}>
                        <img src={p.image} alt=""
                          style={{ width:34, height:34, borderRadius:7, objectFit:'cover', flexShrink:0 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <div>
                          <p style={{ color:'#a8c8e0', fontWeight:600, fontSize:13 }}>{p.name}</p>
                          <p style={{ color:'#1a3a52', fontSize:11 }}>📍 {p.location}</p>
                        </div>
                      </div>
                      <span><span className="g-badge" style={{ background:cc+'18', color:cc, border:`1px solid ${cc}28` }}>{p.category}</span></span>
                      <span><span className="g-badge" style={{ background:sc+'18', color:sc, border:`1px solid ${sc}28` }}>{p.season}</span></span>
                      <span style={{ color:'#5a8aaa', fontSize:13 }}>₹ {parseInt(p.budget).toLocaleString()}</span>
                      <span style={{ color:'#5a8aaa', fontSize:13 }}>{p.days}d</span>
                      <span>
                        <span className="g-badge" style={{ background:isActive ? 'rgba(16,185,129,0.1)':'rgba(100,116,139,0.1)', color:isActive ? '#34d399':'#64748b', border:`1px solid ${isActive ? 'rgba(16,185,129,0.2)':'rgba(100,116,139,0.2)'}` }}>
                          ● {p.status}
                        </span>
                      </span>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="g-btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setViewPlace(p)}>View</button>
                        <button className="g-btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setDeleteId(p.id)}>✕ Remove</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ height:24 }} />
        </div>
      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function GuideDashboardPage() {
  return (
    <AuthGuard allowedRoles={['TOUR_GUIDE']}>
      <GuideDashboard />
    </AuthGuard>
  )
}