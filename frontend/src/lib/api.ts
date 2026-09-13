import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach JWT to every request ──────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('safetrail_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Handle 401 globally ──────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('safetrail_token')
      localStorage.removeItem('safetrail_user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  // Step 1: validate password → sends OTP to email
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  // Step 2: verify OTP → returns token + userId
  verifyLogin: (email: string, otp: string) =>
    api.post(`/api/auth/login/verify?email=${encodeURIComponent(email)}&otp=${otp}`),

  // Step 1: send registration data → sends OTP to email
  register: (data: object) =>
    api.post('/api/auth/register', data),

  // Step 2: verify OTP → creates account + returns token + userId
  verifyRegister: (email: string, otp: string, data: object) =>
    api.post(`/api/auth/register/verify?email=${encodeURIComponent(email)}&otp=${otp}`, data),
}

// ── Tourists ─────────────────────────────────────────────────
export const touristApi = {
  getMe:    ()              => api.get('/api/tourists/me'),
  getAll:   ()              => api.get('/api/tourists'),
  getById:  (id: number)    => api.get(`/api/tourists/${id}`),
  update:   (id: number, data: object) => api.put(`/api/tourists/${id}`, data),
  updateLocation: (touristId: number, data: object) =>
    api.post(`/api/location/update/${touristId}`, data),
  getLocationHistory: (id: number, limit = 50) =>
    api.get(`/api/location/history/${id}?limit=${limit}`),
}

// ── Alerts ───────────────────────────────────────────────────
export const alertApi = {
  // ✅ Tourist-safe: fetch alerts belonging to the logged-in tourist
  getAll:       ()                                => api.get('/api/alerts'),

  // ✅ Tourist-safe: trigger a panic/SOS alert
  triggerPanic: (touristId: number, data: object) =>
    api.post(`/api/emergency/panic/${touristId}`, data),

  // ✅ Tourist-safe: create a general alert
  create:       (touristId: number, data: object) =>
    api.post(`/api/alerts/${touristId}`, data),

  // ⚠️  AUTHORITY ONLY — do NOT call these from tourist pages.
  // They require the AUTHORITY role and will return 403 for tourists.
  authority: {
    getActive:  ()             => api.get('/api/emergency/alerts'),
    getCount:   ()             => api.get('/api/emergency/alerts/count'),
    resolve:    (id: number)   => api.put(`/api/emergency/alerts/${id}/resolve`),
  },
}

// ── Safety Zones ─────────────────────────────────────────────
export const zoneApi = {
  getAll:  ()                          => api.get('/api/zones'),
  getById: (id: number)                => api.get(`/api/zones/${id}`),
  create:  (data: object)              => api.post('/api/zones', data),
  update:  (id: number, data: object)  => api.put(`/api/zones/${id}`, data),
  delete:  (id: number)                => api.delete(`/api/zones/${id}`),
}

// ── Weather ──────────────────────────────────────────────────
export const weatherApi = {
  get:         (lat: number, lon: number) =>
    api.get(`/api/weather?lat=${lat}&lon=${lon}`),
  getCurrent:  (lat: number, lon: number) =>
    api.get(`/api/weather/current?lat=${lat}&lon=${lon}`),
  getForecast: (lat: number, lon: number) =>
    api.get(`/api/weather/forecast?lat=${lat}&lon=${lon}`),
}

// ── AI ───────────────────────────────────────────────────────
export const aiApi = {
  suggest: (message: string, context?: string) =>
    api.post('/api/ai/suggest', { message, context }),
}

// ── Authority ────────────────────────────────────────────────
export const authorityApi = {
  getAllTourists:  ()             => api.get('/api/authority/tourists'),
  getSosTourists: ()             => api.get('/api/authority/tourists/sos'),
  getAlerts:      ()             => api.get('/api/authority/alerts'),
  getStats:       ()             => api.get('/api/authority/stats'),
  broadcast:      (data: object) => api.post('/api/authority/broadcast', data),
}

// ── Emergency Contacts ───────────────────────────────────────
export const contactApi = {
  getAll:  (touristId: number) =>
    api.get(`/api/tourists/${touristId}/contacts`),
  create:  (touristId: number, data: object) =>
    api.post(`/api/tourists/${touristId}/contacts`, data),
  delete:  (touristId: number, contactId: number) =>
    api.delete(`/api/tourists/${touristId}/contacts/${contactId}`),
}

export default api