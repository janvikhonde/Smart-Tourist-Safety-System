interface Props {
  children: React.ReactNode
  className?: string
  glowColor?: string
  onClick?: () => void
}

export default function Card({ children, className = '', glowColor, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:border-sky-400/30' : ''}
        ${className}`}
      style={{
        background: '#111d35',
        border: '1px solid rgba(56,189,248,0.1)',
        boxShadow: glowColor ? `0 0 20px ${glowColor}` : undefined,
      }}>
      {children}
    </div>
  )
}