'use client'

import { useEffect, useState, RefObject, memo } from 'react'

interface ScrollProgressBarProps {
  scrollRef: RefObject<HTMLDivElement | null>
}

// Ruler-style scroll bar — equal height rectangles, only shows on scrollable pages
function ScrollProgressBar({ scrollRef }: ScrollProgressBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isScrollable, setIsScrollable] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    // Check if content is scrollable
    const checkScrollable = () => {
      const canScroll = el.scrollHeight > el.clientHeight + 10
      setIsScrollable(canScroll)
    }

    const handleScroll = () => {
      const scrollTop = el.scrollTop
      const docHeight = el.scrollHeight - el.clientHeight
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setScrollProgress(scrolled)
    }

    checkScrollable()
    el.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', checkScrollable)

    // Re-check after content loads
    const timer = setTimeout(checkScrollable, 500)

    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', checkScrollable)
      clearTimeout(timer)
    }
  }, [scrollRef])

  // Don't render if page isn't scrollable
  if (!isScrollable) return null

  const totalBars = 60

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-stretch"
      style={{ height: '6px', backgroundColor: 'transparent' }}
    >
      {Array.from({ length: totalBars }).map((_, i) => {
        const barProgress = (i / totalBars) * 100
        const isScrolled = scrollProgress >= barProgress

        return (
          <div
            key={i}
            className="flex-1 transition-colors duration-100"
            style={{
              backgroundColor: isScrolled ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)',
              marginRight: '1px',
            }}
          />
        )
      })}
    </div>
  )
}

export default memo(ScrollProgressBar)
