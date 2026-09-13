'use client'
import { useState, useEffect } from 'react'
import { weatherApi } from '@/lib/api'
import { WeatherData } from '@/types'

// Default: Aurangabad, Maharashtra
const DEFAULT_LAT = 19.8762
const DEFAULT_LNG = 75.3433

export const useWeather = (lat = DEFAULT_LAT, lon = DEFAULT_LNG) => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await weatherApi.get(lat, lon)
        setWeather(res.data)
      } catch {
        setError('Failed to load weather data')
      } finally {
        setLoading(false)
      }
    }
    fetch()
    const id = setInterval(fetch, 10 * 60 * 1000) // every 10 min
    return () => clearInterval(id)
  }, [lat, lon])

  return { weather, loading, error }
}