import { create } from 'zustand'
import { Alert, SafetyZone, Tourist, User } from '@/types'

interface AppState {
  // ── Auth ──────────────────────────────────────
  user:      User | null
  token:     string | null
  setAuth:   (user: User, token: string) => void
  clearAuth: () => void

  // ── Tourists ──────────────────────────────────
  activeTourists:        Tourist[]
  setTourists:           (t: Tourist[]) => void
  updateTouristLocation: (id: number, lat: number, lng: number) => void

  // ── Alerts ────────────────────────────────────
  activeAlerts: Alert[]
  setAlerts:    (a: Alert[]) => void
  addAlert:     (a: Alert) => void
  resolveAlert: (id: number) => void

  // ── Safety Zones ──────────────────────────────
  safetyZones: SafetyZone[]
  setZones:    (z: SafetyZone[]) => void
  updateZone:  (id: number, data: Partial<SafetyZone>) => void

  // ── My Location ───────────────────────────────
  myLat: number | null
  myLng: number | null
  setMyLocation: (lat: number, lng: number) => void

  // ── UI ────────────────────────────────────────
  sidebarOpen:    boolean
  setSidebarOpen: (v: boolean) => void
  isMobile:       boolean
  setIsMobile:    (v: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  // ── Auth ──────────────────────────────────────
  user:  null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),

  // ── Tourists ──────────────────────────────────
  activeTourists: [],
  setTourists: (activeTourists) => set({ activeTourists }),
  updateTouristLocation: (id, lat, lng) =>
    set((s) => ({
      activeTourists: s.activeTourists.map((t) =>
        t.id === id ? { ...t, currentLat: lat, currentLng: lng } : t
      ),
    })),

  // ── Alerts ────────────────────────────────────
  activeAlerts: [],
  setAlerts: (activeAlerts) => set({ activeAlerts }),
  addAlert: (a) =>
    set((s) => ({
      activeAlerts: [a, ...s.activeAlerts.filter((x) => x.id !== a.id)],
    })),
  resolveAlert: (id) =>
    set((s) => ({
      activeAlerts: s.activeAlerts.map((a) =>
        a.id === id ? { ...a, status: 'RESOLVED' as const } : a
      ),
    })),

  // ── Safety Zones ──────────────────────────────
  safetyZones: [],
  setZones: (safetyZones) => set({ safetyZones }),
  updateZone: (id, data) =>
    set((s) => ({
      safetyZones: s.safetyZones.map((z) =>
        z.id === id ? { ...z, ...data } : z
      ),
    })),

  // ── My Location ───────────────────────────────
  myLat: null,
  myLng: null,
  setMyLocation: (myLat, myLng) => set({ myLat, myLng }),

  // ── UI ────────────────────────────────────────
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
}))