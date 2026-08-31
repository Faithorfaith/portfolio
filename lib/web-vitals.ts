import { useEffect } from 'react'

/**
 * Web Vitals monitoring component
 * Tracks Core Web Vitals and reports to console for debugging
 */
export function useWebVitals() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Monitor Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const lcpEntry = entry as PerformanceEntry & { renderTime?: number; loadTime?: number }
        console.log('[v0] LCP:', lcpEntry.renderTime || lcpEntry.loadTime)
      }
    })

    observer.observe({ entryTypes: ['largest-contentful-paint'] })

    // Monitor First Input Delay (FID) / Interaction to Next Paint (INP)
    const handlePointerDown = () => {
      performance.mark('fid-start')
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      observer.disconnect()
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])
}

/**
 * Monitor and report performance metrics
 */
export function reportWebVitals(metric: any) {
  if (metric.label === 'web-vital') {
    console.log(`[v0] ${metric.name}:`, metric.value, `(${metric.rating})`)
  }
}
