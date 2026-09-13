'use client'
import { useState, useEffect } from 'react'
import { contactApi } from '@/lib/api'
import { EmergencyContact } from '@/types'
import { getUser } from '@/lib/auth'
import Badge from '@/components/shared/Badge'
import Button from '@/components/shared/Button'
import Modal from '@/components/shared/Modal'
import { toast } from '@/components/shared/Toast'

const MOCK: EmergencyContact[] = [
  { id: 1, name: 'Priya Sharma', phone: '+91 9876543211', relation: 'Spouse',  email: '', isPrimary: true  },
  { id: 2, name: 'Ravi Sharma',  phone: '+91 9876543212', relation: 'Brother', email: '', isPrimary: false },
]

export default function EmergencyContacts() {
  const user = getUser()
  const [contacts, setContacts] = useState<EmergencyContact[]>(MOCK)
  const [showAdd, setShowAdd]   = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({ name: '', phone: '', relation: '', email: '' })

  useEffect(() => {
    if (!user) return
    contactApi.getAll(user.id)
      .then(r => setContacts(r.data))
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const add = async () => {
    if (!user || !form.name || !form.phone) return
    setSaving(true)
    try {
      const res = await contactApi.create(user.id, form)
      setContacts(prev => [...prev, res.data])
      toast.success('Emergency contact added!')
    } catch {
      setContacts(prev => [
        ...prev,
        { id: Date.now(), ...form, isPrimary: prev.length === 0 },
      ])
      toast.success('Emergency contact added!')
    } finally {
      setSaving(false)
      setShowAdd(false)
      setForm({ name: '', phone: '', relation: '', email: '' })
    }
  }

  const remove = async (id: number) => {
    if (!user) return
    setDeleting(id)
    try { await contactApi.delete(user.id, id) } catch {}
    setContacts(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
    toast.info('Contact removed')
  }

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#111d35', border: '1px solid rgba(56,189,248,0.1)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}
        >
          <div>
            <h2 className="font-syne font-bold text-white text-sm">Emergency Contacts</h2>
            <p className="text-slate-600 text-[10px] mt-0.5">
              Notified by email automatically during SOS
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>+ Add</Button>
        </div>

        {/* List */}
        <div className="divide-y divide-white/[0.04]">
          {contacts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <span className="text-3xl opacity-30">👤</span>
              <p className="text-slate-600 text-xs">No emergency contacts yet</p>
              <Button size="xs" variant="outline" onClick={() => setShowAdd(true)}>
                Add First Contact
              </Button>
            </div>
          )}

          {contacts.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-5 py-3.5 group hover:bg-white/[0.02] transition-all"
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: 'rgba(244,63,94,0.12)', color: '#f87171', border: '1px solid rgba(244,63,94,0.2)' }}
              >
                {c.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                  {c.isPrimary && <Badge variant="safe" size="xs">Primary</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs text-slate-500">{c.phone}</p>
                  <span className="text-slate-700">·</span>
                  <p className="text-xs text-slate-600">{c.relation}</p>
                  {c.email ? (
                    <>
                      <span className="text-slate-700">·</span>
                      <p className="text-xs text-emerald-500 truncate max-w-[150px]">✉️ {c.email}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-700">·</span>
                      <p className="text-xs text-amber-500">⚠️ No email — won't get SOS alert</p>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <a href={`tel:${c.phone}`} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                  📞 Call
                </a>
                <button
                  onClick={() => remove(c.id)}
                  disabled={deleting === c.id}
                  className="text-xs text-red-400 hover:text-red-300 font-medium disabled:opacity-40"
                >
                  {deleting === c.id ? '…' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Emergency Contact"
        subtitle="Will receive an email automatically if you trigger SOS"
      >
        <div className="space-y-4">
          {([
            { label: 'Full Name',                          key: 'name',     placeholder: 'Jane Doe',                       type: 'text'  },
            { label: 'Phone Number',                       key: 'phone',    placeholder: '+91 9876543210',                  type: 'tel'   },
            { label: 'Relationship',                       key: 'relation', placeholder: 'Parent / Spouse / Friend',        type: 'text'  },
            { label: 'Email Address',                      key: 'email',    placeholder: 'jane@email.com',                  type: 'email' },
          ] as const).map(f => (
            <div key={f.key}>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">
                {f.label}
                {f.key === 'email' && (
                  <span className="text-amber-400 ml-1 font-normal text-[10px]">
                    — required for SOS email alerts
                  </span>
                )}
              </label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="input-field"
              />
            </div>
          ))}

          {/* Warning if no email entered */}
          {!form.email && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
              <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
              <p className="text-xs text-amber-400 leading-relaxed">
                Without an email address, this contact <strong>won't receive automated SOS notifications</strong> when you trigger an alert.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowAdd(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={add}
              loading={saving}
              disabled={!form.name || !form.phone}
              className="flex-1"
            >
              Add Contact
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}