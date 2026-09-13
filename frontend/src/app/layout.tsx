import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SafeTrail — Smart Tourist Safety',
  description: 'Real-time tourist safety monitoring system for Aurangabad',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}