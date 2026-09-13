// ─── Auth & User ───────────────────────────────────────────────────────────
export type UserRole =
  | 'TOURIST'
  | 'AUTHORITY'
  | 'ADMIN'
  | 'TOUR_GUIDE'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  touristId?: string | null
}

export interface AuthResponse {
  token: string
  role: string
  name: string
  userId: number
  profileId?: string
  touristId?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone: string
  nationality: string
  passportNo?: string
  role: UserRole
  badgeNumber?: string
  department?: string
  jurisdiction?: string
  guideId?: string
  specialization?: string
}

// ─── Tourist ────────────────────────────────────────────────────────────────
export interface Tourist {
  id: number
  touristId: string
  user: User
  phone: string
  nationality: string
  passportNo?: string
  idProofType?: string
  idProofNumber?: string
  checkedInAt?: string
  currentLat: number | null
  currentLng: number | null
  status: 'ACTIVE' | 'INACTIVE' | 'SOS' | 'OFFLINE' | 'EMERGENCY'
  lastSeen?: string
}

// ─── Location ────────────────────────────────────────────────────────────────
export interface LocationUpdate {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface LocationHistory {
  id: number
  latitude: number
  longitude: number
  accuracy: number
  recordedAt: string
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export type AlertType     = 'PANIC' | 'GEOFENCE_EXIT' | 'GEOFENCE' | 'CROWD' | 'WEATHER' | 'ANOMALY' | 'INFO' | 'SYSTEM'
export type AlertPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type AlertStatus   = 'ACTIVE' | 'RESOLVED' | 'DISMISSED' | 'ACKNOWLEDGED'

export interface Alert {
  id: number
  type: AlertType
  priority: AlertPriority
  title: string
  description: string
  latitude?: number
  longitude?: number
  status: AlertStatus
  createdAt: string
  resolvedAt?: string
  tourist?: Tourist
}

// ─── Safety Zone ─────────────────────────────────────────────────────────────
export type ZoneStatus = 'SAFE' | 'WARNING' | 'DANGER' | 'CLOSED'

export interface SafetyZone {
  id: number
  name: string
  description: string
  centerLat: number
  centerLng: number
  radiusMeters: number
  status: ZoneStatus
  touristCount: number
  createdAt?: string
}

// ─── Emergency Contact ───────────────────────────────────────────────────────
export interface EmergencyContact {
  id: number
  name: string
  phone: string
  relation: string
  isPrimary: boolean
}

// ─── Weather ─────────────────────────────────────────────────────────────────
export interface WeatherData {
  city: string
  temp: number
  feelsLike: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  visibility: number
  uvIndex?: number
  forecast: ForecastDay[]
  hourly: HourlyItem[]
}

export interface ForecastDay {
  date: string
  dayName: string
  tempMax: number
  tempMin: number
  description: string
  icon: string
  rainChance: number
}

export interface HourlyItem {
  time: string
  temp: number
  icon: string
  windSpeed: number
}

// ─── Place ───────────────────────────────────────────────────────────────────
export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH'

export interface Place {
  id: number
  name: string
  type: string
  emoji: string
  rating: number
  reviewCount: number
  distanceKm: number
  crowdLevel: CrowdLevel
  touristCount: number
  isOpen: boolean
  openingTime: string
  bestVisitTime: string
  lat: number
  lng: number
  safetyNote: string
}

// ─── Authority ───────────────────────────────────────────────────────────────
export interface Authority {
  id: number
  user: User
  badgeNumber: string
  department: string
  jurisdiction: string
}

// ─── AI ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AiContext {
  activeTourists: number
  activeAlerts: number
  temperature: number
  weather: string
  zoneSummary: string
}

// ─── WebSocket ───────────────────────────────────────────────────────────────
export interface WsLocationMessage {
  touristId: number
  lat: number
  lng: number
}

export interface WsAlertMessage {
  type: AlertType
  touristId: number
  touristCode: string
  lat: number
  lng: number
  alertId: number
}

// kept for backward compat
export type WsEmergencyMessage = WsAlertMessage

export interface WsBroadcastMessage {
  message: string
  type: string
  from: string
}

// ─── API Response wrapper ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}