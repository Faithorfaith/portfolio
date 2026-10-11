'use client'

import { useEffect } from 'react'
export default function PostHogProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || document.querySelector('script[data-posthog]')) return
    const win = window as Window & { posthog?: Record<string, unknown> }
    win.posthog = win.posthog || {}
    const script = document.createElement('script')
    script.dataset.posthog = 'true'
    script.async = true
    script.src = 'https://us-assets.i.posthog.com/static/array.js'
    script.onload = () => {
      const posthog = (window as Window & { posthog?: { init: (token: string, options: Record<string, unknown>) => void } }).posthog
      posthog?.init(key, { api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com', capture_pageview: true, capture_pageleave: true, autocapture: true, respect_dnt: true })
    }
    document.head.appendChild(script)
  }, [])
  return null
}
