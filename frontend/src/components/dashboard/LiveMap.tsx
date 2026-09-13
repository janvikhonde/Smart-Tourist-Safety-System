'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { touristApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { SafetyZone } from '@/types'

const DEFAULT_CENTER: [number, number] = [19.8762, 75.3433]
const LOCATION_SYNC_MS = 15_000

const ZONE_COLORS: Record<string, string> = {
  SAFE:    '#16a34a',
  WARNING: '#d97706',
  DANGER:  '#dc2626',
  CLOSED:  '#64748b',
}

const ZONE_BG: Record<string, string> = {
  SAFE:    '#dcfce7',
  WARNING: '#fef3c7',
  DANGER:  '#fee2e2',
  CLOSED:  '#f1f5f9',
}

const MOCK_ZONES: SafetyZone[] = [
  { id: 1, name: 'Ajanta Caves',    description: '', centerLat: 20.5519, centerLng: 75.7033, radiusMeters: 500, status: 'SAFE',    touristCount: 312, createdAt: '' },
  { id: 2, name: 'Ellora Caves',    description: '', centerLat: 20.0269, centerLng: 75.1780, radiusMeters: 800, status: 'SAFE',    touristCount: 218, createdAt: '' },
  { id: 3, name: 'Bibi Ka Maqbara',description: '', centerLat: 19.9016, centerLng: 75.3236, radiusMeters: 300, status: 'WARNING', touristCount: 89,  createdAt: '' },
  { id: 4, name: 'City Market',     description: '', centerLat: 19.8762, centerLng: 75.3433, radiusMeters: 400, status: 'DANGER',  touristCount: 54,  createdAt: '' },
  { id: 5, name: 'Daulatabad Fort', description: '', centerLat: 19.9467, centerLng: 75.2178, radiusMeters: 600, status: 'SAFE',    touristCount: 173, createdAt: '' },
]

export default function LiveMap() {
  const mapRef       = useRef<HTMLDivElement>(null)
  const mapInst      = useRef<L.Map | null>(null)
  const myMarkerRef  = useRef<L.CircleMarker | null>(null)
  const myCircleRef  = useRef<L.Circle | null>(null)
  const watchIdRef   = useRef<number | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { safetyZones, myLat, myLng, setMyLocation } = useStore()
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'active' | 'denied'>('idle')
  const [accuracy,  setAccuracy]  = useState<number | null>(null)
  const authUser = getUser()

  const zones = safetyZones.length > 0 ? safetyZones : MOCK_ZONES

  const syncToBackend = useCallback((lat: number, lng: number, acc: number) => {
    if (!authUser?.id) return
    touristApi.updateLocation(authUser.id, { latitude: lat, longitude: lng, accuracy: acc })
      .catch(() => {})
  }, [authUser?.id])

  const updateMyMarker = useCallback((lat: number, lng: number, acc: number) => {
    const L = (window as unknown as { L: typeof import('leaflet') }).L
    if (!mapInst.current || !L) return

    if (!myMarkerRef.current) {
      // Accuracy ring
      myCircleRef.current = L.circle([lat, lng], {
        radius:      acc,
        color:       '#2563eb',
        fillColor:   '#2563eb',
        fillOpacity: 0.08,
        weight:      1,
        dashArray:   '4 4',
      }).addTo(mapInst.current)

      // Blue dot with white border
      myMarkerRef.current = L.circleMarker([lat, lng], {
        radius:      10,
        color:       '#ffffff',
        fillColor:   '#2563eb',
        fillOpacity: 1,
        weight:      3,
      })
        .addTo(mapInst.current)
        .bindPopup(`
          <div style="
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            padding:10px 12px; min-width:150px;
          ">
            <p style="font-weight:700;font-size:13px;margin:0 0 4px;color:#0f172a;">📍 Your Location</p>
            <p style="font-size:11px;color:#64748b;margin:0;font-family:monospace;">
              ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </p>
          </div>
        `)
    } else {
      myMarkerRef.current.setLatLng([lat, lng])
      myCircleRef.current?.setLatLng([lat, lng])
      myCircleRef.current?.setRadius(acc)
    }
  }, [])

  const startGps = useCallback(() => {
    if (!navigator.geolocation) { setGpsStatus('denied'); return }
    setGpsStatus('requesting')

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords
        setGpsStatus('active')
        setAccuracy(Math.round(acc))
        setMyLocation(lat, lng)
        updateMyMarker(lat, lng, acc)
        if (mapInst.current) {
          mapInst.current.setView([lat, lng], Math.max(mapInst.current.getZoom(), 14))
        }
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )

    syncTimerRef.current = setInterval(() => {
      const { myLat: lat, myLng: lng } = useStore.getState()
      if (lat && lng) syncToBackend(lat, lng, accuracy ?? 50)
    }, LOCATION_SYNC_MS)
  }, [updateMyMarker, syncToBackend, accuracy, setMyLocation])

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInst.current) return
    const L = (window as unknown as { L: typeof import('leaflet') }).L

    mapInst.current = L.map(mapRef.current, {
      center:      DEFAULT_CENTER,
      zoom:        11,
      zoomControl: false,
    })

    // ── LIGHT tile layer (OpenStreetMap) ──────────────────────────────────
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInst.current)

    // Zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(mapInst.current)

    // Inject light popup styles once
    if (!document.getElementById('livemap-light-style')) {
      const style = document.createElement('style')
      style.id = 'livemap-light-style'
      style.textContent = `
        .leaflet-container { background: #e8edf2 !important; }
        .lm-popup .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important;
          border: 1px solid #e2e8f0 !important;
          padding: 0 !important;
        }
        .lm-popup .leaflet-popup-tip { background: #ffffff !important; }
        .lm-popup .leaflet-popup-content { margin: 0 !important; }
        .lm-popup .leaflet-popup-close-button {
          color: #94a3b8 !important; top: 6px !important; right: 8px !important;
        }
        .lm-tooltip {
          background: #1e293b !important; border: none !important;
          color: #f1f5f9 !important; font-size: 11px !important;
          font-weight: 600 !important; padding: 3px 8px !important;
          border-radius: 6px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        }
        .lm-tooltip::before { display: none !important; }
        .leaflet-control-zoom a {
          background: #ffffff !important; color: #334155 !important;
          border: 1px solid #e2e8f0 !important;
        }
        .leaflet-control-zoom a:hover { background: #f8fafc !important; }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.8) !important;
        }
      `
      document.head.appendChild(style)
    }

    // ── Safety zone circles + pin markers ────────────────────────────────
    zones.forEach(zone => {
      const color = ZONE_COLORS[zone.status] ?? '#3b82f6'
      const bg    = ZONE_BG[zone.status]     ?? '#dbeafe'

      // Geo-fence circle
      L.circle([zone.centerLat, zone.centerLng], {
        radius:      zone.radiusMeters,
        color,
        fillColor:   color,
        fillOpacity: 0.10,
        weight:      2,
        dashArray:   zone.status === 'DANGER' ? '6 4' : undefined,
      }).addTo(mapInst.current!)

      // Teardrop pin
      const pinHtml = `
        <div style="filter:drop-shadow(0 3px 6px ${color}55);">
          <svg viewBox="0 0 36 44" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.059 0 0 8.059 0 18c0 13 18 26 18 26S36 31 36 18C36 8.059 27.941 0 18 0z"
              fill="${color}"/>
            <circle cx="18" cy="17" r="7" fill="white"/>
          </svg>
        </div>
      `

      L.marker([zone.centerLat, zone.centerLng], {
        icon: L.divIcon({
          className:  '',
          html:       pinHtml,
          iconSize:   [32, 40],
          iconAnchor: [16, 40],
          popupAnchor:[0, -42],
        }),
      })
        .addTo(mapInst.current!)
        .bindPopup(`
          <div style="
            padding:12px 14px; min-width:175px;
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          ">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="width:9px;height:9px;border-radius:50%;background:${color};flex-shrink:0;"></div>
              <p style="margin:0;font-weight:700;font-size:13px;color:#0f172a;">${zone.name}</p>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span style="font-size:11px;color:#475569;background:#f1f5f9;padding:2px 8px;border-radius:20px;">
                👥 ${zone.touristCount} tourists
              </span>
              <span style="
                font-size:11px;font-weight:700;
                background:${bg};color:${color};
                padding:2px 8px;border-radius:20px;
                border:1px solid ${color}30;
              ">${zone.status}</span>
            </div>
            <p style="margin:6px 0 0;font-size:10px;color:#94a3b8;">Radius: ${zone.radiusMeters}m</p>
          </div>
        `, { className: 'lm-popup', maxWidth: 240 })
        .bindTooltip(zone.name, { direction: 'top', className: 'lm-tooltip', offset: [0, -42] })
    })

    const { myLat: lat, myLng: lng } = useStore.getState()
    if (lat && lng) updateMyMarker(lat, lng, 50)

    startGps()
  }, [zones, updateMyMarker, startGps])

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id    = 'leaflet-css'
      link.rel   = 'stylesheet'
      link.href  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    if ((window as unknown as { L?: unknown }).L) {
      initMap(); return
    }

    if (document.getElementById('leaflet-js')) {
      const poll = setInterval(() => {
        if ((window as unknown as { L?: unknown }).L) { clearInterval(poll); initMap() }
      }, 100)
      return
    }

    const script  = document.createElement('script')
    script.id     = 'leaflet-js'
    script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async  = true
    script.onload = initMap
    document.head.appendChild(script)
  }, [initMap])

  useEffect(() => {
    return () => {
      if (watchIdRef.current  != null) navigator.geolocation?.clearWatch(watchIdRef.current)
      if (syncTimerRef.current != null) clearInterval(syncTimerRef.current)
      mapInst.current?.remove()
      mapInst.current = null
    }
  }, [])

  const legend = [
    { label: 'Safe',    color: '#16a34a' },
    { label: 'Warning', color: '#d97706' },
    { label: 'Danger',  color: '#dc2626' },
  ]

  const gpsLabel: Record<typeof gpsStatus, string> = {
    idle:       'Locating…',
    requesting: 'Requesting GPS…',
    active:     accuracy ? `GPS ±${accuracy}m` : 'GPS Active',
    denied:     'GPS unavailable',
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >
      {/* Map container — light background so no black flash */}
      <div
        ref={mapRef}
        className="w-full h-72 lg:h-[400px]"
        style={{ background: '#e8edf2' }}
      />

      {/* LIVE badge */}
      <div
        className="absolute top-3 left-3 flex items-center gap-1.5
          px-2.5 py-1 rounded-full text-xs font-bold z-[1000]"
        style={{
          background: '#ffffff',
          border:     '1px solid #fee2e2',
          color:      '#dc2626',
          boxShadow:  '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        LIVE
      </div>

      {/* GPS status */}
      <div
        className="absolute top-10 left-3 flex items-center gap-1.5
          px-2.5 py-1 rounded-full text-xs font-medium z-[1000] mt-1"
        style={{
          background: '#ffffff',
          border:     `1px solid ${gpsStatus === 'active' ? '#bbf7d0' : gpsStatus === 'denied' ? '#fee2e2' : '#e2e8f0'}`,
          color:      gpsStatus === 'active' ? '#16a34a' : gpsStatus === 'denied' ? '#dc2626' : '#64748b',
          boxShadow:  '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${gpsStatus === 'active' ? 'animate-pulse' : ''}`}
          style={{
            background: gpsStatus === 'active' ? '#16a34a'
                      : gpsStatus === 'denied' ? '#dc2626' : '#94a3b8',
          }}
        />
        {gpsLabel[gpsStatus]}
      </div>

      {/* Zone count */}
      <div
        className="absolute top-3 right-3 px-2.5 py-1 rounded-full
          text-xs font-semibold z-[1000]"
        style={{
          background: '#ffffff',
          border:     '1px solid #e2e8f0',
          color:      '#475569',
          boxShadow:  '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {zones.length} zones
      </div>

      {/* Re-centre button */}
      {myLat && myLng && (
        <button
          onClick={() => mapInst.current?.setView([myLat, myLng], 15)}
          className="absolute bottom-12 right-3 w-9 h-9 rounded-xl flex items-center
            justify-center text-base z-[1000] transition-all hover:scale-105"
          style={{
            background: '#ffffff',
            border:     '1px solid #e2e8f0',
            boxShadow:  '0 2px 8px rgba(0,0,0,0.08)',
          }}
          title="Centre on my location"
        >
          📍
        </button>
      )}

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 flex gap-3 px-3 py-2
          rounded-xl z-[1000] text-xs"
        style={{
          background: '#ffffff',
          border:     '1px solid #e2e8f0',
          boxShadow:  '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {legend.map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            <span className="text-slate-500 font-medium">{l.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}