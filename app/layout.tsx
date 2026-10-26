import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import SoundControl from '@/components/portfolio/sound-control'
import { ArticleAudioProvider } from '@/components/article-audio-provider'
import MotionOrchestrator from '@/components/portfolio/motion-orchestrator'
import { Inter } from 'next/font/google'
import PostHogProvider from '@/components/posthog-provider'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Faith Awokunle — Designer & Video Editor',
  description: 'Explore Faith Awokunle’s architectural portfolio of product design, video editing, and visual storytelling.',
  icons: {
    icon: { url: '/favicon.ico', type: 'image/png' },
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Faith Awokunle — Designer & Video Editor',
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
        <link rel="stylesheet" href="/gallery/fonts.css" />
        {/* Critical inline styles for above-the-fold content */}
        <style>{`
          body { margin: 0; padding: 0; }
          main { display: flex; flex-direction: column; width: 100%; min-height: 100vh; background: #FAFAFA; }
        `}</style>
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />

        {/* Preconnect to critical domains , reduces TLS handshake time */}
        <link rel="preconnect" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.variable}>
        <ArticleAudioProvider>
          <MotionOrchestrator />
          {children}
          <SoundControl />
          <PostHogProvider />
        </ArticleAudioProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
