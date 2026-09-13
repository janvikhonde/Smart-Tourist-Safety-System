'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { aiApi } from '@/lib/api'
import { ChatMessage } from '@/types'
import ChatMessageComponent from './ChatMessage'
import SuggestionChips from './SuggestionChips'

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Hello! I'm **SafeTrail AI**, your personal safety assistant. 🛡️

I can help you with:
• **Real-time safety alerts** in your area
• **Weather-based travel advice**
• **Crowd levels** at popular tourist sites
• **Emergency guidance** and nearest services
• **Best visiting times** and local travel tips

How can I assist you today?`,
  timestamp: new Date().toISOString(),
}

interface Props {
  /** Extra class for the outer wrapper */
  className?: string
}

export default function ChatWindow({ className = '' }: Props) {
  const { activeAlerts } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setInput('')
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      },
    ])
    setLoading(true)

    try {
      const res = await aiApi.suggest({
        message: trimmed,
        context: {
          location: 'Aurangabad, Maharashtra',
          activeTourists: 1247,
          activeAlerts: activeAlerts.filter(a => a.status === 'ACTIVE').length,
          timestamp: new Date().toISOString(),
        },
      })

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: res.data.response ?? res.data.message ?? 'I could not get a response. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `I'm having trouble connecting right now.\n\nFor emergencies please call:\n• **Police:** 100\n• **Ambulance:** 108\n• **Tourist Helpline:** 1363`,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [loading, activeAlerts])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  // Auto-grow textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ background: '#070b14' }}
    >
      {/* ── Message list ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 space-y-4">
        {messages.map(msg => (
          <ChatMessageComponent key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <ChatMessageComponent
            message={{
              id: 'typing',
              role: 'assistant',
              content: '',
              timestamp: new Date().toISOString(),
            }}
            isTyping
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions ──────────────────────────── */}
      <div
        className="px-4 lg:px-5 py-2"
        style={{ borderTop: '1px solid rgba(56,189,248,0.06)' }}
      >
        <SuggestionChips onSelect={send} disabled={loading} />
      </div>

      {/* ── Input ────────────────────────────────── */}
      <div
        className="px-4 lg:px-5 py-4"
        style={{ borderTop: '1px solid rgba(56,189,248,0.08)' }}
      >
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Ask about safety, weather, places, emergencies…"
            rows={1}
            className="input-field flex-1 resize-none leading-relaxed"
            style={{ minHeight: 44, maxHeight: 120, overflowY: 'auto' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center
              font-bold text-slate-900 text-lg transition-all duration-150
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:brightness-110 active:scale-95 shrink-0"
            style={{ background: '#38bdf8' }}
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
        <p className="text-[10px] text-slate-700 mt-2 text-center">
          Powered by Claude · Responses are AI-generated, use judgement
        </p>
      </div>
    </div>
  )
}