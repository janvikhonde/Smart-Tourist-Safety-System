interface Service {
  name: string
  number: string
  icon: string
  color: string
  description: string
  available24h: boolean
}

const SERVICES: Service[] = [
  {
    name: 'Police Control Room',
    number: '100',
    icon: '👮',
    color: '#38bdf8',
    description: 'Report crime, theft, or any threat',
    available24h: true,
  },
  {
    name: 'Ambulance Service',
    number: '108',
    icon: '🚑',
    color: '#34d399',
    description: 'Medical emergency response',
    available24h: true,
  },
  {
    name: 'Fire Brigade',
    number: '101',
    icon: '🚒',
    color: '#f59e0b',
    description: 'Fire incidents and rescue ops',
    available24h: true,
  },
  {
    name: 'Tourist Helpline',
    number: '1363',
    icon: '🛡️',
    color: '#a855f7',
    description: 'India Tourism helpdesk',
    available24h: true,
  },
  {
    name: 'Women Helpline',
    number: '1091',
    icon: '💁',
    color: '#f43f5e',
    description: 'Women in distress — priority response',
    available24h: true,
  },
  {
    name: 'Disaster Management',
    number: '108',
    icon: '⚠️',
    color: '#fb923c',
    description: 'NDRF / SDRF disaster response',
    available24h: true,
  },
]

export default function ServiceCallCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {SERVICES.map((s, i) => (
        <a
          key={i}
          href={`tel:${s.number}`}
          className="group rounded-2xl p-4 flex flex-col gap-3
            hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-pointer"
          style={{
            background: '#111d35',
            border: `1px solid ${s.color}20`,
            boxShadow: `0 0 0 0 ${s.color}20`,
          }}
        >
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl
                transition-transform group-hover:scale-110"
              style={{ background: `${s.color}15` }}
            >
              {s.icon}
            </div>
            <div className="text-right">
              <p
                className="font-mono font-bold text-lg leading-none"
                style={{ color: s.color }}
              >
                {s.number}
              </p>
              {s.available24h && (
                <p className="text-[10px] text-slate-600 mt-0.5">24/7</p>
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              {s.name}
            </p>
            <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
              {s.description}
            </p>
          </div>

          {/* Call CTA */}
          <div
            className="flex items-center gap-1.5 text-xs font-semibold mt-auto
              transition-all group-hover:gap-2.5"
            style={{ color: s.color }}
          >
            <span>📞</span>
            <span>Tap to Call</span>
            <svg
              className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-all"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Bottom accent */}
          <div
            className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl w-0
              group-hover:w-full transition-all duration-300"
            style={{ background: s.color }}
          />
        </a>
      ))}
    </div>
  )
}