interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const variants = {
  primary: 'bg-sky-400 text-slate-900 font-bold hover:bg-sky-300 active:scale-95',
  danger:  'bg-red-500 text-white font-bold hover:bg-red-400 active:scale-95',
  ghost:   'bg-white/5 text-slate-300 hover:bg-white/10 active:scale-95',
  outline: 'border border-sky-400/30 text-sky-400 hover:bg-sky-400/10 active:scale-95',
}

const sizes = {
  sm: 'text-xs px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-xl',
}

export default function Button({
  variant = 'primary', size = 'md', loading, disabled, children, className = '', ...rest
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200
        ${variants[variant]} ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}`}
      {...rest}>
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent
          rounded-full animate-spin shrink-0" />
      )}
      {children}
    </button>
  )
}