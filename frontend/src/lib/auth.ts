import { User } from '@/types'

const TOKEN_KEY = 'safetrail_token'
const USER_KEY  = 'safetrail_user'

// ── Setters ───────────────────────────────────────────────────────────────────
export const setAuth = (token: string, user: User) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOKEN_KEY, token)
    // FIX: always store the full, up-to-date user object on login/register
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch (err) {
    console.error('Failed to persist auth data:', err)
  }
}

// ── Getters ───────────────────────────────────────────────────────────────────
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as User
    // FIX: basic sanity-check — if the stored object has no id, treat as missing
    if (!user?.id) return null
    return user
  } catch {
    // Corrupted data — clear it so the user is prompted to log in again
    clearAuth()
    return null
  }
}

// ── Update stored user (e.g. after profile edit) ──────────────────────────────
export const updateStoredUser = (partial: Partial<User>) => {
  if (typeof window === 'undefined') return
  try {
    const current = getUser()
    if (!current) return
    localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...partial }))
  } catch (err) {
    console.error('Failed to update stored user:', err)
  }
}

// ── Clear ─────────────────────────────────────────────────────────────────────
export const clearAuth = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // ignore — storage might be unavailable
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export const isAuthenticated = (): boolean => {
  const token = getToken()
  if (!token || token.length === 0) return false
  // FIX: also verify there is a valid user object, not just a token
  const user = getUser()
  return user !== null
}

export const isAuthority = (): boolean => {
  const user = getUser()
  return user?.role === 'AUTHORITY' || user?.role === 'ADMIN'
}