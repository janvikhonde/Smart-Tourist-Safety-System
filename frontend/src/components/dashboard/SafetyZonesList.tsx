'use client'
import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { zoneApi } from '@/lib/api'
import { zoneStatusColor } from '@/lib/utils'
import { SafetyZone } from '@/types'

const MOCK_ZONES: SafetyZone[] = [
  { id: 1, name: 'Ajanta Caves', description: '', centerLat: 20.5519, centerLng: 75.7033, radiusMeters: 500, status: 'SAFE', touristCount: 312 },
  { id: 2, name: 'Ellora Caves', description: '', centerLat: 20.0269, centerLng: 75.1780, radiusMeters: 800, status: 'SAFE', touristCount: 218 },
  { id: 3, name: 'Bibi Ka Maqbara', description: '', centerLat: 19.9016, centerLng: 75.3236, radiusMeters: 300, status: 'WARNING', touristCount: 89 },
  { id: 4, name: 'City Market Area', description: '', centerLat: 19.8762, centerLng: 75.3433, radiusMeters: 400, status: 'DANGER', touristCount: 54 },
  { id: 5, name: 'Daulatabad Fort', description: '', centerLat: 19.9467, centerLng: 75.2178, radiusMeters: 600, status: 'SAFE', touristCount: 173 },
]

export default function SafetyZonesList() {

  const { safetyZones, setZones } = useStore()

  // ✅ Ensure zones is always an array
  const zonesArray: SafetyZone[] = Array.isArray(safetyZones) ? safetyZones : []

  useEffect(() => {
    zoneApi.getAll()
      .then(r => {
        const data = Array.isArray(r?.data) ? r.data : r?.data?.data
        setZones(Array.isArray(data) ? data : MOCK_ZONES)
      })
      .catch(() => setZones(MOCK_ZONES))
  }, [setZones])

  // ✅ Use safe array
  const display = zonesArray.length > 0 ? zonesArray : MOCK_ZONES

  const counts = {
    SAFE: display.filter(z => z.status === 'SAFE').length,
    WARNING: display.filter(z => z.status === 'WARNING').length,
    DANGER: display.filter(z => z.status === 'DANGER').length,
  }

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{
        background: '#111d35',
        border: '1px solid rgba(56,189,248,0.1)',
      }}
    >

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}
      >
        <h2 className="font-syne font-bold text-white text-sm">
          Safety Zones
        </h2>

        <div className="flex items-center gap-2 text-[10px] font-semibold">
          <span style={{ color: '#34d399' }}>{counts.SAFE} safe</span>
          {counts.WARNING > 0 && (
            <span style={{ color: '#f59e0b' }}>
              {counts.WARNING} warn
            </span>
          )}
          {counts.DANGER > 0 && (
            <span style={{ color: '#f43f5e' }}>
              {counts.DANGER} danger
            </span>
          )}
        </div>
      </div>

      {/* Zone rows */}
      <div className="divide-y divide-white/[0.04]">
        {display.map(zone => {

          const c = zoneStatusColor(zone.status)

          const pct = Math.min(
            100,
            Math.round((zone.touristCount / 400) * 100)
          )

          return (
            <div
              key={zone.id}
              className="flex items-center gap-3 px-5 py-3
              hover:bg-white/[0.02] transition-all duration-150 group"
            >

              {/* Status dot */}
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`}
                style={{ boxShadow: `0 0 6px currentColor` }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">

                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {zone.name}
                  </p>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border
                    shrink-0 ${c.bg} ${c.text} ${c.border}`}
                  >
                    {zone.status}
                  </span>
                </div>

                {/* Capacity bar */}
                <div className="flex items-center gap-2">

                  <div
                    className="flex-1 h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >

                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          zone.status === 'SAFE'
                            ? '#34d399'
                            : zone.status === 'WARNING'
                            ? '#f59e0b'
                            : '#f43f5e',
                      }}
                    />

                  </div>

                  <span className="text-[10px] text-slate-600 shrink-0">
                    👥 {zone.touristCount}
                  </span>

                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}