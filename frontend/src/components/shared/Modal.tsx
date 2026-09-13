'use client'
import { useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className={`relative w-full ${sizes[size]} rounded-2xl p-6 z-10`}
           style={{ background: '#111d35', border: '1px solid rgba(56,189,248,0.15)' }}>
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne font-bold text-white text-lg">{title}</h2>
            <button onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors text-xl leading-none">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}