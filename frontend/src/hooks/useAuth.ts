'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { getToken, getUser, clearAuth as clearStorage } from '@/lib/auth'

export const useAuth = (requireAuth = true) => {
  const { user, token, setAuth, clearAuth } = useStore()
  const router = useRouter()

  useEffect(() => {
    // Rehydrate from localStorage on mount
    if (!token) {
      const storedToken = getToken()
      const storedUser  = getUser()
      if (storedToken && storedUser) {
        setAuth(storedUser, storedToken)
      } else if (requireAuth) {
        router.replace('/auth/login')
      }
    }
  }, [token, setAuth, requireAuth, router])

  const logout = () => {
    clearStorage()
    clearAuth()
    router.replace('/auth/login')
  }

  return { user: user ?? getUser(), token: token ?? getToken(), logout, isReady: !!user || !!getUser() }
}