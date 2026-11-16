'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function MovingText({ children }: { children: string }) {
  return <span className="portfolio-moving-text"><span>{children}</span><span aria-hidden="true">{children}</span></span>
}

export default function PortfolioShelf({ title, introduction, children }: {
  title: string
  introduction: string
  children: ReactNode
}) {
  const shelf = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = shelf.current
    const rail = track.current
    if (!section || !rail) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const trackScroll = () => {
      const distance = motion.matches ? 0 : Math.min(30, rail.scrollLeft / 24)
      section.style.setProperty('--shelf-title-shift', `${distance}px`)
    }
    const scrollAcross = (event: WheelEvent) => {
      if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || rail.scrollWidth <= rail.clientWidth) return
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rail.clientWidth : 1
      rail.scrollLeft += event.deltaY * unit
    }

    rail.addEventListener('scroll', trackScroll, { passive: true })
    section.addEventListener('wheel', scrollAcross, { passive: false })
    motion.addEventListener('change', trackScroll)
    trackScroll()
    return () => {
      rail.removeEventListener('scroll', trackScroll)
      section.removeEventListener('wheel', scrollAcross)
      motion.removeEventListener('change', trackScroll)
    }
  }, [])

  return (
    <section ref={shelf} className="portfolio-shelf" aria-labelledby="shelf-title">
      <header className="portfolio-shelf-intro">
        <h1 id="shelf-title">{title}</h1>
        <p>{introduction}</p>
      </header>
      <div ref={track} className="portfolio-shelf-track" tabIndex={0} aria-label={`${title} gallery`}>
        {children}
      </div>
    </section>
  )
}
