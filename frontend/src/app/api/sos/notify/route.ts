/**
 * app/api/sos/notify/route.ts
 *
 * POST /api/sos/notify
 *
 * Sends SOS email notifications to:
 *   1. The tourist's registered email
 *   2. Each emergency contact (if they have an email stored, else skipped — phone is shown)
 *   3. The admin (ADMIN_EMAIL env var)
 *
 * Uses Nodemailer.  Set these env vars in .env.local:
 *
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your@gmail.com
 *   SMTP_PASS=your_app_password          ← use Gmail App Password, NOT account password
 *   SMTP_FROM="SafeTrail Alerts <your@gmail.com>"
 *   ADMIN_EMAIL=admin@yourapp.com
 *
 * For Gmail: enable 2FA → generate an App Password → use that as SMTP_PASS.
 */

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface SOSUser {
  id:    number | string
  name:  string
  email: string
}

interface SOSLocation {
  latitude:  number
  longitude: number
  timestamp: string
  mapsLink:  string
}

interface EmergencyContact {
  name:     string
  phone:    string
  relation: string
  email?:   string   // optional — not all contacts have emails
}

interface NotifyBody {
  alertId?:          number
  user:              SOSUser
  location:          SOSLocation
  emergencyContacts: EmergencyContact[]
}

/* ─── Mailer singleton ───────────────────────────────────────────────────── */
function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   ?? 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
    },
  })
}

/* ─── Email templates ────────────────────────────────────────────────────── */
const FROM = process.env.SMTP_FROM ?? `SafeTrail Alerts <${process.env.SMTP_USER}>`

function touristEmailHtml(user: SOSUser, loc: SOSLocation, alertId?: number) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#ef4444,#be123c);padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:32px;">🆘</p>
            <h1 style="margin:8px 0 4px;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">SOS Alert Sent</h1>
            <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">Your emergency alert has been dispatched</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hi <strong>${user.name}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
              Your <strong>Emergency SOS alert</strong> was successfully triggered on the SafeTrail platform.
              Nearby authorities have been notified.
            </p>

            <!-- Alert details box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecdd3;border-radius:12px;overflow:hidden;margin-bottom:20px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;">Alert Details</p>
                <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;color:#334155;">
                  <tr>
                    <td style="width:120px;color:#64748b;font-weight:600;">Alert ID</td>
                    <td style="color:#0f172a;font-weight:700;">#${alertId ?? 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-weight:600;">Time</td>
                    <td>${new Date(loc.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-weight:600;">Latitude</td>
                    <td>${loc.latitude.toFixed(6)}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-weight:600;">Longitude</td>
                    <td>${loc.longitude.toFixed(6)}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Maps CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr><td align="center">
                <a href="${loc.mapsLink}" target="_blank"
                   style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:13px;font-weight:700;">
                  📍 View My Location on Maps
                </a>
              </td></tr>
            </table>

            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
              If this was triggered by mistake, please contact SafeTrail support immediately or call <strong>112</strong>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">SafeTrail · Tourist Safety Platform · This is an automated alert email</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function emergencyContactEmailHtml(contact: EmergencyContact, user: SOSUser, loc: SOSLocation) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#b45309);padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:32px;">🚨</p>
            <h1 style="margin:8px 0 4px;color:#fff;font-size:22px;font-weight:800;">Emergency Alert</h1>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;">Someone you know needs help</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">
              Hi <strong>${contact.name}</strong>,
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
              <strong>${user.name}</strong>, who has listed you as their emergency contact (${contact.relation}),
              has triggered an <strong>SOS alert</strong> on SafeTrail.
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#be123c;font-weight:600;">
              Please try to reach them immediately or contact local authorities.
            </p>

            <!-- Location box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin-bottom:20px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;">Last Known Location</p>
                <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;color:#334155;">
                  <tr>
                    <td style="width:120px;color:#64748b;font-weight:600;">Time</td>
                    <td>${new Date(loc.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-weight:600;">Coordinates</td>
                    <td>${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-weight:600;">Phone</td>
                    <td>${user.name} · ${contact.phone}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr><td align="center">
                <a href="${loc.mapsLink}" target="_blank"
                   style="display:inline-block;background:linear-gradient(135deg,#f97316,#b45309);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:13px;font-weight:700;">
                  📍 View Their Location
                </a>
              </td></tr>
            </table>

            <p style="margin:0;font-size:13px;color:#64748b;">
              National Emergency: <strong>112</strong> · Police: <strong>100</strong> · Ambulance: <strong>108</strong>
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">SafeTrail · Tourist Safety Platform · Automated Emergency Notification</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function adminEmailHtml(user: SOSUser, loc: SOSLocation, contacts: EmergencyContact[], alertId?: number) {
  const contactRows = contacts.length
    ? contacts.map(c =>
        `<tr>
          <td style="padding:4px 8px;border:1px solid #e2e8f0;">${c.name}</td>
          <td style="padding:4px 8px;border:1px solid #e2e8f0;">${c.relation}</td>
          <td style="padding:4px 8px;border:1px solid #e2e8f0;">${c.phone}</td>
          <td style="padding:4px 8px;border:1px solid #e2e8f0;">${c.email ?? '—'}</td>
        </tr>`
      ).join('')
    : `<tr><td colspan="4" style="padding:8px;text-align:center;color:#94a3b8;">No emergency contacts on file</td></tr>`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#0f172a;padding:24px 32px;text-align:center;">
            <p style="margin:0;font-size:28px;">🛡️</p>
            <h1 style="margin:8px 0 4px;color:#fff;font-size:20px;font-weight:800;">Admin SOS Alert</h1>
            <p style="margin:0;color:#94a3b8;font-size:12px;">SafeTrail Platform · Requires Immediate Attention</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px;">

            <!-- Summary banner -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;margin-bottom:24px;">
              <tr><td style="padding:14px 18px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#be123c;">SOS triggered by tourist — immediate review required</p>
                <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Alert ID: #${alertId ?? 'N/A'}</p>
              </td></tr>
            </table>

            <!-- Tourist info -->
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;">Tourist Information</p>
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;color:#334155;border-collapse:collapse;margin-bottom:20px;">
              <tr style="background:#f8fafc;">
                <td style="width:130px;font-weight:600;color:#64748b;padding:6px 8px;border:1px solid #e2e8f0;">Name</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">${user.name}</td>
              </tr>
              <tr>
                <td style="font-weight:600;color:#64748b;padding:6px 8px;border:1px solid #e2e8f0;">Email</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;"><a href="mailto:${user.email}" style="color:#3b82f6;">${user.email}</a></td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="font-weight:600;color:#64748b;padding:6px 8px;border:1px solid #e2e8f0;">User ID</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">${user.id}</td>
              </tr>
              <tr>
                <td style="font-weight:600;color:#64748b;padding:6px 8px;border:1px solid #e2e8f0;">Alert Time</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">${new Date(loc.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="font-weight:600;color:#64748b;padding:6px 8px;border:1px solid #e2e8f0;">Coordinates</td>
                <td style="padding:6px 8px;border:1px solid #e2e8f0;">${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}</td>
              </tr>
            </table>

            <!-- Maps link -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td>
                <a href="${loc.mapsLink}" target="_blank"
                   style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:700;">
                  📍 Open Location in Google Maps
                </a>
              </td></tr>
            </table>

            <!-- Emergency contacts table -->
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;">Emergency Contacts on File</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px;margin-bottom:8px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Name</th>
                  <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Relation</th>
                  <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Phone</th>
                  <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;color:#475569;">Email</th>
                </tr>
              </thead>
              <tbody>${contactRows}</tbody>
            </table>

          </td>
        </tr>

        <tr>
          <td style="background:#0f172a;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#475569;">SafeTrail Admin Dashboard · Automated SOS Notification · Do not reply to this email</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/* ─── Route handler ──────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body: NotifyBody = await req.json()
    const { alertId, user, location, emergencyContacts } = body

    // Validate minimum required fields
    if (!user?.email) {
      return NextResponse.json(
        { error: 'user.email is required' },
        { status: 400 },
      )
    }

    const transporter = createTransporter()
    const notified: string[] = []
    const errors: string[] = []

    const adminEmail = process.env.ADMIN_EMAIL ?? ''

    // ── 1. Email to tourist ─────────────────────────────────────────────
    try {
      await transporter.sendMail({
        from:    FROM,
        to:      user.email,
        subject: `🆘 SOS Alert Sent — SafeTrail (#${alertId ?? 'N/A'})`,
        html:    touristEmailHtml(user, location, alertId),
      })
      notified.push(user.email)
    } catch (err: any) {
      errors.push(`Tourist email failed: ${err?.message}`)
    }

    // ── 2. Email to each emergency contact that has an email ────────────
    for (const contact of emergencyContacts) {
      if (!contact.email) continue
      try {
        await transporter.sendMail({
          from:    FROM,
          to:      contact.email,
          subject: `🚨 Emergency: ${user.name} needs help — SafeTrail`,
          html:    emergencyContactEmailHtml(contact, user, location),
        })
        notified.push(contact.email)
      } catch (err: any) {
        errors.push(`Contact (${contact.name}) email failed: ${err?.message}`)
      }
    }

    // ── 3. Email to admin ───────────────────────────────────────────────
    if (adminEmail) {
      try {
        await transporter.sendMail({
          from:    FROM,
          to:      adminEmail,
          subject: `[ADMIN] SOS Alert #${alertId ?? 'N/A'} — ${user.name}`,
          html:    adminEmailHtml(user, location, emergencyContacts, alertId),
        })
        notified.push(adminEmail)
      } catch (err: any) {
        errors.push(`Admin email failed: ${err?.message}`)
      }
    } else {
      errors.push('ADMIN_EMAIL not set — admin notification skipped.')
    }

    return NextResponse.json({ notified, errors }, { status: 200 })
  } catch (err: any) {
    console.error('[SOS notify] Unhandled error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    )
  }
}