interface Props {
  children: React.ReactNode
  variant?: 'default' | 'high' | 'medium' | 'low' | 'safe' | 'danger' | 'warn' | 'purple'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  default: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  high:    'bg-red-500/15 text-red-400 border-red-500/30',
  medium:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low:     'bg-sky-500/15 text-sky-400 border-sky-500/30',
  safe:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  danger:  'bg-red-500/15 text-red-400 border-red-500/30',
  warn:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  purple:  'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

const sizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border
      ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}