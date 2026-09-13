'use client'
import { useStore } from '@/store/useStore'

interface Insight {
  icon: string
  label: string
  value: string
  color: string
  sub?: string
}

export default function InsightPanel() {
  const { activeTourists, activeAlerts, safetyZones } = useStore()

  const activeCount  = activeAlerts.filter(a => a.status === 'ACTIVE').length || 3
  const safeZones    = safetyZones.filter(z => z.status === 'SAFE').length || 18
  const warnZones    = safetyZones.filter(z => z.status === 'WARNING').length || 2
  const totalTourists = activeTourists.length || 1247

  const insights: Insight[] = [
    {
      icon: '👥',
      label: 'Active Tourists',
      value: totalTourists.toLocaleString(),
      color: '#38bdf8',
      sub: 'in Aurangabad',
    },
    {
      icon: '🚨',
      label: 'Active Alerts',
      value: String(activeCount),
      color: activeCount > 0 ? '#f43f5e' : '#34d399',
      sub: activeCount > 0 ? 'need attention' : 'all clear',
    },
    {
      icon: '⛅',
      label: 'Current Weather',
      value: '34°C',
      color: '#f59e0b',
      sub: 'Partly Cloudy',
    },
    {
      icon: '🛡️',
      label: 'Zone Status',
      value: `${safeZones} safe`,
      color: '#34d399',
      sub: warnZones > 0 ? `${warnZones} warnings` : 'all zones safe',
    },
  ]

  return (
    <div className="flex flex-col h-full"
         style={{ background: '#0d1525', borderLeft: '1px solid rgba(56,189,248,0.08)' }}>

      {/* Header */}
      <div className="px-5 py-4 shrink-0"
           style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
        <h3 className="font-syne font-bold text-white text-sm">Live Context</h3>
        <p className="text-slate-500 text-xs mt-0.5">AI is aware of real-time data</p>
      </div>

      {/* Insight cards */}
      <div className="p-4 space-y-3">
        {insights.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/[0.02]"
            style={{ background: '#111d35', border: '1px solid rgba(56,189,248,0.06)' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
              style={{ background: `${item.color}12` }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-600 font-medium">{item.label}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: item.color }}>
                {item.value}
              </p>
              {item.sub && (
                <p className="text-[10px] text-slate-600 mt-0.5">{item.sub}</p>
              )}
            </div>
            {/* Pulse dot for live data */}
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
              style={{ background: item.color }}
            />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px my-1" style={{ background: 'rgba(56,189,248,0.06)' }} />

      {/* Safety tips */}
      <div className="p-4">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
          Quick Safety Tips
        </p>
        <div className="space-y-2">
          {[
            '🌡️ Stay hydrated in high temperatures',
            '📱 Keep emergency numbers saved',
            '📍 Share location with your group',
            '🕐 Avoid isolated areas after sunset',
          ].map((tip, i) => (
            <p key={i} className="text-[11px] text-slate-500 leading-relaxed">
              {tip}
            </p>
          ))}
        </div>
      </div>

      {/* Model info */}
      <div className="p-4 mt-auto">
        <div
          className="rounded-xl p-3"
          style={{ background: '#111d35', border: '1px solid rgba(56,189,248,0.06)' }}
        >
          <p className="text-[10px] text-slate-500 font-semibold mb-1">🤖 AI Model</p>
          <p className="text-[10px] text-sky-400 font-mono">claude-sonnet-4-20250514</p>
          <p className="text-[10px] text-slate-700 mt-1.5 leading-relaxed">
            Conversations are private and not stored beyond this session.
          </p>
        </div>
      </div>
    </div>
  )
}