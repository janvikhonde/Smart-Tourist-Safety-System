'use client'
import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
const colors = {
  success: 'border-emerald-500/40 text-emerald-400',
  error:   'border-red-500/40 text-red-400',
  warning: 'border-amber-500/40 text-amber-400',
  info:    'border-sky-500/40 text-sky-400',
}

interface ToastItemProps { toast: ToastMessage; onRemove: (id: string) => void }

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onRemove])

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
      border backdrop-blur-sm animate-fade-in ${colors[toast.type]}`}
         style={{ background: '#111d35', minWidth: 260 }}>
      <span>{icons[toast.type]}</span>
      <span className="text-slate-200 flex-1">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="text-slate-500 hover:text-slate-300 ml-2">✕</button>
    </div>
  )
}

// ── Simple global toast system ────────────────────────────────
let _addToast: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null

export const toast = {
  success: (message: string) => _addToast?.({ type: 'success', message }),
  error:   (message: string) => _addToast?.({ type: 'error',   message }),
  warning: (message: string) => _addToast?.({ type: 'warning', message }),
  info:    (message: string) => _addToast?.({ type: 'info',    message }),
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    _addToast = (msg) => {
      setToasts(prev => [...prev, { ...msg, id: Math.random().toString(36).slice(2) }])
    }
    return () => { _addToast = null }
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
    </div>
  )
}