interface Props { size?: 'sm' | 'md' | 'lg'; className?: string }

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }

export default function Spinner({ size = 'md', className = '' }: Props) {
  return (
    <div className={`border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin
      ${sizes[size]} ${className}`} />
  )
}