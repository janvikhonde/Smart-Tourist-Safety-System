'use client'

interface Destination {
  name: string
  emoji: string
  time: string
  km: string
  color: string
  traffic: 'light' | 'moderate' | 'heavy'
}

const DESTINATIONS: Destination[] = [
  { name: 'Ajanta Caves',      emoji: '🗿', time: '2h 10m', km: '102 km', color: '#38bdf8', traffic: 'light'    },
  { name: 'Ellora Caves',      emoji: '🏛️', time: '45m',    km: '29 km',  color: '#34d399', traffic: 'moderate' },
  { name: 'Bibi Ka Maqbara',  emoji: '🕌', time: '12m',    km: '4.2 km', color: '#a855f7', traffic: 'light'    },
  { name: 'Daulatabad Fort',  emoji: '🏰', time: '28m',    km: '13 km',  color: '#f59e0b', traffic: 'moderate' },
  { name: 'Panchakki',        emoji: '🌊', time: '8m',     km: '2.1 km', color: '#34d399', traffic: 'light'    },
]

const trafficColors = {
  light:    '#34d399',
  moderate: '#f59e0b',
  heavy:    '#f43f5e',
}

const trafficLabels = {
  light:    'Light',
  moderate: 'Moderate',
  heavy:    'Heavy',
}

export default function TravelTimeWidget() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: '#111d35',
        border: '1px solid rgba(56,189,248,0.1)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-syne font-bold text-white text-sm">Travel Times</h2>
        <span className="text-[10px] text-slate-600">from Aurangabad</span>
      </div>

      <div className="space-y-2.5">
        {DESTINATIONS.map((dest, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-1 group hover:bg-white/[0.02]
              rounded-lg px-1 transition-all cursor-default"
          >
            {/* Emoji */}
            <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">
              {dest.emoji}
            </span>

            {/* Name + km */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{dest.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-600">{dest.km}</span>
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: `${trafficColors[dest.traffic]}15`,
                    color: trafficColors[dest.traffic],
                  }}
                >
                  {trafficLabels[dest.traffic]}
                </span>
              </div>
            </div>

            {/* Time */}
            <span
              className="text-xs font-bold shrink-0 font-mono"
              style={{ color: dest.color }}
            >
              {dest.time}
            </span>
          </div>
        ))}
      </div>

      {/* Refresh note */}
      <p className="text-[10px] text-slate-700 mt-3 pt-3"
         style={{ borderTop: '1px solid rgba(56,189,248,0.06)' }}>
        🔄 Updated every 5 minutes
      </p>
    </div>
  )
}