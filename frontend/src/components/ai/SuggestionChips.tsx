'use client'

interface Props {
  onSelect: (suggestion: string) => void
  disabled?: boolean
}

const SUGGESTIONS = [
  { label: 'Safety check',     text: 'Is it safe to explore Ajanta Caves today?' },
  { label: 'Weather advice',   text: 'What precautions should I take in this weather?' },
  { label: 'Areas to avoid',   text: 'Which areas should I avoid tonight?' },
  { label: 'Nearest hospital', text: 'Where is the nearest hospital to my location?' },
  { label: 'Best time',        text: 'What is the best time to visit Ellora Caves?' },
  { label: 'Emergency guide',  text: 'What should I do in case of an emergency?' },
  { label: 'Crowd levels',     text: 'Which popular places are less crowded right now?' },
  { label: 'Local transport',  text: 'What are the safest transport options available?' },
]

export default function SuggestionChips({ onSelect, disabled }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
      {SUGGESTIONS.map((s, i) => (
        <button
          key={i}
          onClick={() => !disabled && onSelect(s.text)}
          disabled={disabled}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium
            text-sky-400 hover:text-sky-300 hover:bg-sky-400/[0.12]
            transition-all duration-150 whitespace-nowrap
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            border: '1px solid rgba(56,189,248,0.2)',
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}