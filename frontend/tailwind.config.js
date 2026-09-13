/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg:      '#070b14',
        surface: '#0d1525',
        card:    '#111d35',
        accent:  '#38bdf8',
        danger:  '#f43f5e',
        safe:    '#34d399',
        warn:    '#f59e0b',
        purple:  '#a855f7',
      },
      animation: {
        pulse2: 'pulse2 2s infinite',
        expand: 'expand 2s infinite',
      },
      keyframes: {
        pulse2: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.4)' } },
        expand: { '0%': { transform: 'scale(1)', opacity: '1' }, '100%': { transform: 'scale(1.2)', opacity: '0' } },
      },
    },
  },
  plugins: [],
}