'use client'

import { useAlerts } from '@/hooks/useAlerts'
import { alertTypeIcon, priorityColor, timeAgo } from '@/lib/utils'
import Badge from '@/components/shared/Badge'
import Spinner from '@/components/shared/Spinner'
import { Alert } from '@/types'

const MOCK_ALERTS: Alert[] = [
  {
    id: 1,
    type: 'PANIC',
    priority: 'HIGH',
    status: 'ACTIVE',
    title: 'SOS Panic — Ajanta Caves Exit',
    description: 'Tourist TRS-4821 triggered SOS alert near zone perimeter',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: 2,
    type: 'GEOFENCE',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    title: 'Geo-fence Breach — Market Area',
    description: 'Tourist TRS-3912 entered restricted zone boundary',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 3,
    type: 'ANOMALY',
    priority: 'LOW',
    status: 'ACKNOWLEDGED',
    title: 'Crowd Spike — Ellora Caves',
    description: 'Density exceeded threshold by 42% — monitoring',
    createdAt: new Date(Date.now() - 28 * 60000).toISOString(),
  },
  {
    id: 4,
    type: 'INFO',
    priority: 'LOW',
    status: 'RESOLVED',
    title: 'New Tourist Check-in',
    description: 'TRS-2256 registered at Bibi Ka Maqbara entry point',
    createdAt: new Date(Date.now() - 52 * 60000).toISOString(),
  },
]

function statusBadge(status: Alert['status']): 'danger' | 'warn' | 'safe' | 'default' {
  const map: Record<Alert['status'], 'danger' | 'warn' | 'safe' | 'default'> = {
    ACTIVE:       'danger',
    ACKNOWLEDGED: 'warn',
    RESOLVED:     'safe',
    DISMISSED:    'default',
  }
  return map[status] ?? 'default'
}

export default function AlertsList() {
  const { alerts, resolve } = useAlerts()
  const display = alerts.length > 0 ? alerts : MOCK_ALERTS
  const activeCount = display.filter(a => a.status === 'ACTIVE').length

  return (
    <div
      className="rounded-2xl flex flex-col h-full shadow-xl backdrop-blur-lg"
      style={{
        background: 'linear-gradient(180deg,#0f1b32,#111d35)',
        border: '1px solid rgba(56,189,248,0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-white text-base tracking-wide">Safety Alerts</h2>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white animate-pulse"
              style={{ background: '#ef4444' }}>
              {activeCount} Active
            </span>
          )}
        </div>
        <span className="text-xs font-medium px-3 py-1 rounded-full"
          style={{
            background: activeCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            color: activeCount > 0 ? '#f87171' : '#34d399',
          }}>
          {activeCount > 0 ? 'Attention Needed' : 'System Stable'}
        </span>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        {display.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Spinner size="sm" />
          </div>
        ) : (
          display.map(alert => {
            const pc = priorityColor(alert.priority)
            return (
              <div key={alert.id}
                className="group px-6 py-4 flex items-start gap-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-all duration-200">
                <div className="w-1 rounded-full self-stretch"
                  style={{ background: pc ? pc.border.replace('/30', '') : '#64748b' }} />
                <div className="text-xl mt-1">{alertTypeIcon(alert.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{alert.title}</h3>
                    <span className="text-[11px] text-slate-500">{timeAgo(alert.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={alert.priority.toLowerCase() as 'high' | 'medium' | 'low'}>
                      {alert.priority}
                    </Badge>
                    <Badge variant={statusBadge(alert.status)}>{alert.status}</Badge>
                    {alert.status === 'ACTIVE' && (
                      <button onClick={() => resolve(alert.id)}
                        className="ml-auto text-[11px] text-emerald-400 hover:text-emerald-300 transition font-medium opacity-0 group-hover:opacity-100">
                        ✓ Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3" style={{ borderTop: '1px solid rgba(56,189,248,0.06)' }}>
        <button className="text-xs text-sky-400 hover:text-sky-300 font-medium transition">
          View full alert history →
        </button>
      </div>
    </div>
  )
}