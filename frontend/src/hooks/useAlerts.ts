'use client'

import { useEffect, useState } from 'react'

export interface Alert {
  id:          number
  type:        string
  title:       string
  description: string
  priority:    'HIGH' | 'MEDIUM' | 'LOW'
  status:      string
  createdAt:   string
  [key: string]: any
}

/**
 * useAlerts — tourist-safe, no API calls.
 *
 * Both /api/alerts and /api/emergency/alerts require AUTHORITY role
 * and return 403 for tourist accounts. This hook reads locally stored
 * SOS alerts instead, avoiding the 403 entirely.
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('safetrail_sos_history')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setAlerts(parsed)
      }
    } catch {
      setAlerts([])
    }
  }, [])

  return { alerts, loading: false, error: null, refetch: () => {} }
}