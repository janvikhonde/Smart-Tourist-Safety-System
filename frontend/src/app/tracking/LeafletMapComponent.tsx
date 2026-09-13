'use client'
import { useEffect, useRef } from 'react'

const NANDED_CENTER: [number, number] = [19.0748, 77.3029]
const DEFAULT_ZOOM = 13

const STATUS_COLOR: Record<string, string> = {
  SAFE:    '#16a34a',
  WARNING: '#d97706',
  DANGER:  '#dc2626',
}

interface Zone {
  name: string
  lat: number
  lng: number
  r: number
  status: string
  count: number
}

interface Props {
  zones: Zone[]
  myLat?: number | null
  myLng?: number | null
}

export default function LeafletMapComponent({ zones, myLat, myLng }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<any>(null)
  const myMarkerRef    = useRef<any>(null)
  const initializedRef = useRef(false)

  /* ── Init map once ── */
  useEffect(() => {
    // Guard against React StrictMode double-invoke
    if (initializedRef.current) return
    if (!containerRef.current) return

    initializedRef.current = true

    import('leaflet').then(L => {
      // If the DOM node already has a leaflet id, destroy it first
      if ((containerRef.current as any)?._leaflet_id) {
        delete (containerRef.current as any)._leaflet_id
      }

      // Fix broken default icon paths in webpack/Next.js
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Inject Leaflet CSS once
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id   = 'leaflet-css'
        link.rel  = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Inject pulse animation CSS once
      if (!document.getElementById('pulse-style')) {
        const s = document.createElement('style')
        s.id = 'pulse-style'
        s.textContent = `
          @keyframes pulse-ring {
            0%   { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(2.4); opacity: 0; }
          }`
        document.head.appendChild(s)
      }

      // Create map centered on Nanded
      const map = L.map(containerRef.current!, {
        center:             NANDED_CENTER,
        zoom:               DEFAULT_ZOOM,
        zoomControl:        true,
        attributionControl: true,
      })

      mapRef.current = map

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Draw zone circles + markers
      zones.forEach(zone => {
        const color = STATUS_COLOR[zone.status] ?? '#3B82F6'

        L.circle([zone.lat, zone.lng], {
          radius:      zone.r,
          fillColor:   color,
          color,
          fillOpacity: 0.18,
          weight:      2,
        }).addTo(map)

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width:32px;height:32px;border-radius:50% 50% 50% 0;
              background:${color};border:2px solid #fff;
              transform:rotate(-45deg);
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
            ">
              <div style="
                transform:rotate(45deg);
                display:flex;align-items:center;justify-content:center;
                width:100%;height:100%;font-size:13px;color:#fff;font-weight:700;
              ">${zone.status === 'SAFE' ? '✓' : zone.status === 'WARNING' ? '!' : '✕'}</div>
            </div>`,
          iconSize:   [32, 32],
          iconAnchor: [16, 32],
        })

        L.marker([zone.lat, zone.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:system-ui;min-width:160px">
              <strong style="font-size:13px">${zone.name}</strong><br/>
              <span style="font-size:11px;color:${color};font-weight:600">${zone.status}</span>
              <span style="font-size:11px;color:#64748B"> · ${zone.count} tourists</span><br/>
              <span style="font-size:10px;color:#94A3B8">Radius: ${zone.r}m</span>
            </div>`)
      })

      // Draw GPS marker if coords are already available on first render
      if (myLat && myLng) {
        drawMyMarker(L, map, myLat, myLng)
      }
    })

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      initializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // empty deps — init once only

  /* ── Update GPS marker when coords change ── */
  useEffect(() => {
    if (!mapRef.current || !myLat || !myLng) return
    import('leaflet').then(L => {
      drawMyMarker(L, mapRef.current, myLat, myLng)
    })
  }, [myLat, myLng])

  function drawMyMarker(L: any, map: any, lat: number, lng: number) {
    // Remove previous marker
    if (myMarkerRef.current) {
      myMarkerRef.current.remove()
      myMarkerRef.current = null
    }

    const myIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:22px;height:22px">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:rgba(59,130,246,0.3);
            animation:pulse-ring 1.5s ease-out infinite;
          "></div>
          <div style="
            position:absolute;top:50%;left:50%;
            transform:translate(-50%,-50%);
            width:13px;height:13px;border-radius:50%;
            background:#3B82F6;border:2.5px solid #fff;
            box-shadow:0 0 0 2px #3B82F6;
          "></div>
        </div>`,
      iconSize:   [22, 22],
      iconAnchor: [11, 11],
    })

    myMarkerRef.current = L.marker([lat, lng], { icon: myIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:system-ui;font-size:12px">
          <strong>📍 You are here</strong><br/>
          <span style="color:#64748B;font-size:10px">Nanded, Maharashtra</span>
        </div>`)

    // Pan map to the live GPS location
    map.setView([lat, lng], DEFAULT_ZOOM, { animate: true })
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#E8EDF2' }}
    />
  )
}