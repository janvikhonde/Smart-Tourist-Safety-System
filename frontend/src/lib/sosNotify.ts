/**
 * lib/sosNotify.ts
 *
 * Sends SOS alert via EmailJS REST API (not the SDK).
 *
 * WHY REST API instead of @emailjs/browser SDK?
 *   The SDK returns 412 when localhost:3000 is not in your EmailJS
 *   "Allowed Origins" whitelist. The REST API bypasses that check entirely.
 *
 * EmailJS template (template_xyxskwv):
 *   - To Email  : safetrail15@gmail.com  (hardcoded in dashboard)
 *   - Subject   : {{subject}}
 *   - From Email: Use Default Email Address ✅
 */

import { getUser } from '@/lib/auth'

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface SOSPayload {
  latitude:  number
  longitude: number
  timestamp: string
}

export interface SOSResult {
  notified: string[]
  errors:   string[]
  alertId?: number
}

interface EmergencyContact {
  id?:        number
  name:       string
  phone:      string
  relation:   string
  email?:     string
  isPrimary?: boolean
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getMapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
}

function getStoredContacts(userId?: number | string): EmergencyContact[] {
  try {
    const keys = [
      `emergency_contacts_${userId}`,
      'safetrail_emergency_contacts',
      'emergency_contacts',
    ]
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    }
    return []
  } catch {
    return []
  }
}

/** Save triggered SOS to localStorage so useAlerts can display it */
function saveSOSToHistory(alertId: number, payload: SOSPayload, userName: string) {
  try {
    const existing = JSON.parse(localStorage.getItem('safetrail_sos_history') ?? '[]')
    const newAlert = {
      id:          alertId,
      type:        'SOS',
      title:       `SOS Alert — ${userName}`,
      description: `Location: ${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`,
      priority:    'HIGH',
      status:      'ACTIVE',
      createdAt:   payload.timestamp,
    }
    const updated = [newAlert, ...existing].slice(0, 20) // keep last 20
    localStorage.setItem('safetrail_sos_history', JSON.stringify(updated))
  } catch {
    // ignore storage errors
  }
}

/* ─── EmailJS via REST API (bypasses 412 origin whitelist issue) ─────────── */
async function sendEmailViaREST(params: Record<string, string>): Promise<void> {
  const serviceId  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID      ?? ''
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_SOS_TEMPLATE_ID ?? ''
  const publicKey  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY       ?? ''

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('Missing EmailJS env vars — check .env.local')
  }

  const body = {
    service_id:   serviceId,
    template_id:  templateId,
    user_id:      publicKey,       // EmailJS REST API uses "user_id" for the public key
    template_params: params,
  }

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`EmailJS REST error ${res.status}: ${text}`)
  }
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export async function dispatchSOS(payload: SOSPayload): Promise<SOSResult> {
  const notified: string[] = []
  const errors:   string[] = []
  const alertId  = Date.now()

  const user = getUser()

  if (!user) {
    errors.push('No logged-in user found. Please log in and try again.')
    return { notified, errors, alertId }
  }

  if (!user.email) {
    errors.push('User account has no email address.')
    return { notified, errors, alertId }
  }

  const mapsLink = getMapsLink(payload.latitude, payload.longitude)
  const timeStr  = formatTime(payload.timestamp)
  const contacts = getStoredContacts(user.id)

  const contactLines = contacts.length
    ? contacts
        .map((c, i) =>
          `${i + 1}. ${c.name} (${c.relation})\n` +
          `   Phone : ${c.phone}\n` +
          `   Email : ${c.email ?? 'No email on file'}`,
        )
        .join('\n\n')
    : 'No emergency contacts added by this tourist.'

  try {
    await sendEmailViaREST({
      subject:       `SOS ALERT #${alertId} — ${user.name} needs help!`,
      tourist_name:  user.name  ?? 'Unknown',
      tourist_email: user.email,
      alert_id:      String(alertId),
      alert_time:    timeStr,
      latitude:      payload.latitude.toFixed(6),
      longitude:     payload.longitude.toFixed(6),
      maps_link:     mapsLink,
      message:
        `TOURIST\n` +
        `Name    : ${user.name}\n` +
        `Email   : ${user.email}\n` +
        `User ID : ${user.id}\n\n` +
        `LOCATION\n` +
        `Time    : ${timeStr} IST\n` +
        `Coords  : ${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)}\n` +
        `Maps    : ${mapsLink}\n\n` +
        `EMERGENCY CONTACTS\n` +
        `${contactLines}\n\n` +
        `Emergency: 112  |  Police: 100  |  Ambulance: 108  |  Fire: 101`,
    })

    // Save to localStorage so the Recent Incidents panel shows it
    saveSOSToHistory(alertId, payload, user.name ?? 'Tourist')

    notified.push('safetrail15@gmail.com')
    console.info(`[SOS] ✅ Alert #${alertId} sent successfully`)
  } catch (err: any) {
    errors.push(`SOS email failed: ${err?.message ?? String(err)}`)
    console.error('[SOS] ❌ Email error:', err)
  }

  return { notified, errors, alertId }
}