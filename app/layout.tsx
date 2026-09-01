import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import SoundControl from '@/components/portfolio/sound-control'
import { ArticleAudioProvider } from '@/components/article-audio-provider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Faith Awokunle — Product Designer',
  description: 'Product designer turning complex digital products into clear, usable experiences across strategy, UX, interface design, and prototyping.',
  icons: {
    icon: { url: '/favicon.ico', type: 'image/png' },
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Faith Awokunle — Product Designer',
    description: 'Selected product design work, case studies, and writing about making complex products clear and usable.',
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
        <ArticleAudioProvider>
          {children}
          <SoundControl />
        </ArticleAudioProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
