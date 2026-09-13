import { AlertPriority, AlertStatus, AlertType, CrowdLevel, ZoneStatus } from '@/types'

// ─── Date & Time ─────────────────────────────────────────────
export const formatTime = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Color helpers ───────────────────────────────────────────
export const priorityColor = (p: AlertPriority) => ({
  HIGH:   { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30'    },
  MEDIUM: { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30'  },
  LOW:    { bg: 'bg-sky-500/15',    text: 'text-sky-400',    border: 'border-sky-500/30'    },
  INFO:   { bg: 'bg-slate-500/15',  text: 'text-slate-400',  border: 'border-slate-500/30'  },
}[p])

export const zoneStatusColor = (s: ZoneStatus) => ({
  SAFE:    { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  WARNING: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   dot: 'bg-amber-400'   },
  DANGER:  { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30',     dot: 'bg-red-400'     },
  CLOSED:  { bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/30',   dot: 'bg-slate-400'   },
}[s])

export const alertStatusColor = (s: AlertStatus) => ({
  ACTIVE:       'text-red-400',
  ACKNOWLEDGED: 'text-amber-400',
  RESOLVED:     'text-emerald-400',
  DISMISSED:    'text-slate-400',
}[s])

export const crowdColor = (c: CrowdLevel) => ({
  LOW:      { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  MODERATE: { bg: 'bg-amber-500/15',   text: 'text-amber-400'   },
  HIGH:     { bg: 'bg-red-500/15',     text: 'text-red-400'     },
}[c])

// ─── Alert icons ─────────────────────────────────────────────
export const alertTypeIcon = (t: AlertType) => ({
  PANIC:        '🆘',
  GEOFENCE_EXIT:'📍',
  GEOFENCE:     '📍',
  CROWD:        '👥',
  WEATHER:      '🌩️',
  ANOMALY:      '⚠️',
  INFO:         'ℹ️',
  SYSTEM:       '🔔',
}[t])

// ─── Distance ────────────────────────────────────────────────
export const haversineKm = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Generate Tourist ID ──────────────────────────────────────
export const generateTouristId = (): string =>
  `TRS-${Math.floor(1000 + Math.random() * 9000)}`

// ─── Truncate ─────────────────────────────────────────────────
export const truncate = (str: string, n: number) =>
  str.length > n ? str.slice(0, n) + '…' : str