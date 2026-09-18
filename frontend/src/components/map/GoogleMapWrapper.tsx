'use client'
/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react'

const MAP_STYLES = [
  { elementType: 'geometry',           stylers: [{ color: '#0d1525' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#38bdf8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#070b14' }] },
  { featureType: 'road',               elementType: 'geometry',         stylers: [{ color: '#1e2d47' }] },
  { featureType: 'road',               elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'water',              elementType: 'geometry',         stylers: [{ color: '#070b14' }] },
  { featureType: 'poi',                elementType: 'geometry',         stylers: [{ color: '#111d35' }] },
]

interface Props {
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  className?: string
  onMapReady?: (map: google.maps.Map) => void
}

declare global {
  interface Window { google: typeof google; __gmapsLoading?: boolean }
}

export default function GoogleMapWrapper({
  center = { lat: 19.8762, lng: 75.3433 },
  zoom = 11,
  height = '400px',
  className = '',
  onMapReady,
}: Props) {
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapInst = useRef<google.maps.Map | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'no-key'>('loading')
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  useEffect(() => {
    if (!apiKey) { setStatus('no-key'); return }
    if (!mapRef.current) return

    const init = () => {
      if (!mapRef.current) return
      mapInst.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      })
      setStatus('ready')
      onMapReady?.(mapInst.current)
    }

    if (window.google?.maps) {
      init()
    } else if (!window.__gmapsLoading) {
      window.__gmapsLoading = true
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
      script.async = true
      script.onload = () => { window.__gmapsLoading = false; init() }
      document.head.appendChild(script)
    } else {
      // Another instance is already loading — poll
      const poll = setInterval(() => {
        if (window.google?.maps) { clearInterval(poll); init() }
      }, 200)
    }
  }, [apiKey, center.lat, center.lng, zoom]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{ background: '#111d35' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-400/30 border-t-sky-400
              rounded-full animate-spin" />
            <p className="text-slate-500 text-xs">Loading map…</p>
          </div>
        </div>
      )}

      {/* No API key */}
      {status === 'no-key' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center
            gap-3 rounded-2xl"
          style={{ background: '#111d35' }}
        >
          <span className="text-5xl opacity-30">🗺️</span>
          <p className="text-slate-400 font-syne font-bold text-sm">Map Preview</p>
          <p className="text-slate-600 text-xs text-center max-w-xs">
            Add{' '}
            <code
              className="px-1.5 py-0.5 rounded text-sky-400"
              style={{ background: 'rgba(56,189,248,0.1)' }}
            >
              NEXT_PUBLIC_GOOGLE_MAPS_KEY
            </code>{' '}
            to enable the live map
          </p>
        </div>
      )}
    </div>
  )
}