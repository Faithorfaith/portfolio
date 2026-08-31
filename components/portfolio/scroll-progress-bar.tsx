'use client'

import { useEffect, useState, RefObject, memo } from 'react'

interface ScrollProgressBarProps {
  scrollRef: RefObject<HTMLDivElement | null>
}

// A single quiet line keeps progress useful without adding visual noise.
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

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-px bg-foreground/8" aria-hidden="true">
      <div
        className="h-full bg-foreground/55 transition-[width] duration-100 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  )
}

export default memo(ScrollProgressBar)
