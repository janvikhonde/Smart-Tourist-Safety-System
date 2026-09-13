'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { touristApi } from '@/lib/api'

type Stat = {
  icon: string
  label: string
  value: string | number
  change?: string
  changePositive?: boolean
  color: string
}

export default function StatCards() {
  const { activeTourists, activeAlerts, safetyZones } = useStore()

  const tourists = Array.isArray(activeTourists) ? activeTourists : []
  const alerts = Array.isArray(activeAlerts) ? activeAlerts : []
  const zones = Array.isArray(safetyZones) ? safetyZones : []

  const [totalTourists, setTotalTourists] = useState<number>(tourists.length || 0)

  useEffect(() => {
    touristApi.getAll()
      .then((res: any) => {
        const data = Array.isArray(res?.data) ? res.data : []
        setTotalTourists(data.length)
      })
      .catch(() => {})
  }, [])

  const highAlerts = alerts.filter((a: any) => a.status === 'ACTIVE').length
  const safeZones = zones.filter((z: any) => z.status === 'SAFE').length
  const warnZones = zones.filter((z: any) => z.status === 'WARNING').length
  const highPriorityAlerts = alerts.filter((a: any) => a.priority === 'HIGH').length

  const stats: Stat[] = [
    {
      icon: '👥',
      label: 'Active Tourists',
      value: totalTourists.toLocaleString(),
      change: '+12 today',
      changePositive: true,
      color: '#38bdf8',
    },
    {
      icon: '🚨',
      label: 'Active Alerts',
      value: highAlerts,
      change: `${highPriorityAlerts} high priority`,
      changePositive: false,
      color: '#f43f5e',
    },
    {
      icon: '🛡️',
      label: 'Safe Zones',
      value: safeZones,
      change: `${warnZones} need attention`,
      changePositive: true,
      color: '#34d399',
    },
    {
      icon: '⚡',
      label: 'Avg Response (min)',
      value: '4.2',
      change: '↓ 0.3 vs yesterday',
      changePositive: true,
      color: '#a855f7',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="rounded-xl p-4 shadow-sm"
          style={{
            background: '#111d35',
            border: `1px solid ${stat.color}33`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">{stat.icon}</span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{
                background: `${stat.color}22`,
                color: stat.color,
              }}
            >
              LIVE
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">{stat.value}</h2>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>

          {stat.change && (
            <p
              className="text-xs mt-2"
              style={{
                color: stat.changePositive ? stat.color : '#f87171',
              }}
            >
              {stat.change}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}