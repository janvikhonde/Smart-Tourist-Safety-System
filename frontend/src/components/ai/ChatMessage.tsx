'use client'
import { ChatMessage as ChatMessageType } from '@/types'
import { formatTime } from '@/lib/utils'

interface Props {
  message: ChatMessageType
  isTyping?: boolean
}

/** Converts **bold** and newlines to HTML */
function renderContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(56,189,248,0.1);color:#38bdf8;padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/\n/g, '<br/>')
}

export default function ChatMessageComponent({ message, isTyping }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center
          text-sm shrink-0 self-end`}
        style={{
          background: isUser
            ? 'rgba(99,102,241,0.2)'
            : 'rgba(56,189,248,0.15)',
          border: `1px solid ${isUser ? 'rgba(99,102,241,0.3)' : 'rgba(56,189,248,0.2)'}`,
        }}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={{
            background: isUser
              ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.1))'
              : '#111d35',
            border: `1px solid ${isUser ? 'rgba(99,102,241,0.25)' : 'rgba(56,189,248,0.1)'}`,
            color: '#e2e8f0',
          }}
        >
          {isTyping ? (
            /* Typing dots */
            <div className="flex items-center gap-1 py-0.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : (
            <p
              dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
            />
          )}
        </div>

        {/* Timestamp */}
        {!isTyping && (
          <p className="text-[10px] text-slate-600 px-1">
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  )
}