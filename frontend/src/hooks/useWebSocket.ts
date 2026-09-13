'use client'
import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { connectWebSocket, disconnectWebSocket } from '@/lib/websocket'
import { WsLocationMessage, WsAlertMessage } from '@/types'   // ← fixed: WsAlertMessage not WsEmergencyMessage

export const useWebSocket = (enabled = true) => {
  const { updateTouristLocation, addAlert } = useStore()

  useEffect(() => {
    if (!enabled) return

    const onLocation = (msg: WsLocationMessage) => {
      updateTouristLocation(msg.touristId, msg.lat, msg.lng)  // ← fixed: lat/lng not latitude/longitude
    }

    const onAlert = (msg: WsAlertMessage) => {
      addAlert({
        id:          msg.alertId,
        type:        msg.type,
        priority:    'HIGH',
        title:       msg.type === 'PANIC' ? '🆘 SOS Panic Alert' : '📍 Geo-fence Breach',
        description: `Tourist #${msg.touristId} triggered ${msg.type} at (${msg.lat.toFixed(4)}, ${msg.lng.toFixed(4)})`,
        latitude:    msg.lat,
        longitude:   msg.lng,
        status:      'ACTIVE',
        createdAt:   new Date().toISOString(),
      })
    }

    connectWebSocket(
      onLocation as (msg: object) => void,
      onAlert    as (msg: object) => void
    )

    return () => disconnectWebSocket()
  }, [enabled, updateTouristLocation, addAlert])
}