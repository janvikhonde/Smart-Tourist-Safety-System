'use client'
import { useState, useCallback, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { getUser } from '@/lib/auth'
import { toast } from '@/components/shared/Toast'
import { dispatchSOS } from '@/lib/sosNotify'

interface Props {
  onTriggered?: (alertId?: number) => void
}

type SOSState = 'idle' | 'holding' | 'sending' | 'sent' | 'error'

export default function SOSButton({ onTriggered }: Props) {
  const { myLat, myLng } = useStore()
  const [state, setState]       = useState<SOSState>('idle')
  const [holdProgress, setHold] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startHold = useCallback(() => {
    if (state !== 'idle') return
    setState('holding')
    let progress = 0
    intervalRef.current = setInterval(() => {
      progress += 2
      setHold(progress)
      if (progress >= 100) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        triggerSOS()
      }
    }, 40)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const cancelHold = useCallback(() => {
    if (state === 'holding') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setState('idle')
      setHold(0)
    }
  }, [state])

  const triggerSOS = async () => {
    setState('sending')

    const user = getUser()
    if (!user?.id) {
      toast.error('Not logged in. Please log in and try again.')
      setState('error')
      return
    }

    const result = await dispatchSOS({
      latitude:  myLat  ?? 19.8762,
      longitude: myLng  ?? 75.3433,
      timestamp: new Date().toISOString(),
    })

    if (result.errors.length > 0 && result.notified.length === 0) {
      setState('error')
      toast.error('Failed to send SOS. Please call 112 directly.')
      console.error('[SOSButton] errors:', result.errors)
    } else {
      setState('sent')
      const n = result.notified.length
      if (result.errors.length > 0) {
        toast.error(`🚨 SOS sent! ${n} email notification(s) dispatched.`)
      } else {
        toast.error(`🚨 SOS sent! Authorities + ${n} contact(s) notified by email.`)
      }
      onTriggered?.(result.alertId)
    }
  }

  const reset = () => {
    setState('idle')
    setHold(0)
  }

  const btnBg =
    state === 'sent'    ? 'linear-gradient(135deg,#34d399,#059669)' :
    state === 'error'   ? 'linear-gradient(135deg,#f59e0b,#d97706)' :
    state === 'sending' ? 'linear-gradient(135deg,#f43f5e,#9f1239)' :
    state === 'holding' ? 'linear-gradient(135deg,#f97316,#dc2626)' :
                          'linear-gradient(135deg,#f43f5e,#be123c)'

  const btnShadow =
    state === 'sent'  ? '0 0 40px rgba(52,211,153,0.5)'  :
    state === 'error' ? '0 0 40px rgba(245,158,11,0.4)'  :
                        '0 0 50px rgba(244,63,94,0.5)'

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center">
        {state === 'idle' && (
          <>
            <div className="absolute w-44 h-44 rounded-full border-2 border-red-500/15 animate-ping"
                 style={{ animationDuration: '2s' }} />
            <div className="absolute w-36 h-36 rounded-full border-2 border-red-500/20 animate-ping"
                 style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
          </>
        )}

        {state === 'holding' && (
          <svg className="absolute w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none"
              stroke="rgba(249,115,22,0.2)" strokeWidth="6" />
            <circle cx="60" cy="60" r="54" fill="none"
              stroke="#f97316" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - holdProgress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.04s linear' }} />
          </svg>
        )}

        <button
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          onClick={state === 'sent' || state === 'error' ? reset : undefined}
          disabled={state === 'sending'}
          className="relative z-10 w-28 h-28 rounded-full flex flex-col items-center
            justify-center text-white gap-1 transition-all duration-200
            active:scale-95 select-none"
          style={{ background: btnBg, boxShadow: btnShadow }}
        >
          {state === 'sending' ? (
            <div className="w-9 h-9 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : state === 'sent' ? (
            <>
              <span className="text-xl">✓</span>
              <span className="font-syne font-bold text-sm">SENT</span>
            </>
          ) : state === 'error' ? (
            <>
              <span className="text-xl">⚠️</span>
              <span className="font-syne font-bold text-sm">RETRY</span>
            </>
          ) : (
            <span className="font-syne font-bold text-lg">
              {state === 'holding' ? 'HOLD' : 'SOS'}
            </span>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center max-w-xs leading-relaxed">
        {state === 'idle'    && 'Hold for 2 seconds to send SOS — emails you, emergency contacts & admin'}
        {state === 'holding' && 'Keep holding to confirm SOS...'}
        {state === 'sending' && 'Sending alert and email notifications...'}
        {state === 'sent'    && 'Done! Emails sent to you, emergency contacts, and admin. Tap to reset.'}
        {state === 'error'   && 'Failed. Please call 112 directly. Tap to retry.'}
      </p>
    </div>
  )
}