'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { touristApi } from '@/lib/api'
import { getUser } from '@/lib/auth'

export const useLocation = (enabled = true) => {
  const { setMyLocation } = useStore()
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setMyLocation(latitude, longitude)

        const user = getUser()
        if (!user?.id) return   // guard: must have a numeric ID

        try {
          await touristApi.updateLocation(user.id, {   // ✅ pass ID first
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString(),
          })
        } catch {
          // silent fail — location may not yet have tourist profile
        }
      },
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [enabled, setMyLocation])
}