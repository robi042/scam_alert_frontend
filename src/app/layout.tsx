import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scam Alert',
  description: 'Crowdsourced reporting for suspicious phone numbers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="app-body">{children}</body>
    </html>
  )
}

