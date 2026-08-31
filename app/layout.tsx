import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Faith Awokunle | Portfolio',
  description: 'Exploring ideas through design - projects and work.',
  icons: {
    icon: { url: '/favicon.ico', type: 'image/png' },
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Faith Awokunle | Portfolio',
    description: 'Exploring ideas through design - projects and work.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ backgroundColor: 'oklch(1 0 0)' }}>
      <head>
        {/* Critical inline styles for above-the-fold content */}
        <style>{`
          body { margin: 0; padding: 0; }
          main { display: flex; flex-direction: column; width: 100%; height: 100vh; background: oklch(1 0 0); }
        `}</style>
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />

        {/* Preconnect to critical domains — reduces TLS handshake time */}
        <link rel="preconnect" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
