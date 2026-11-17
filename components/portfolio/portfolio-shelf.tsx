'use client'

import { createContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export function MovingText({ children }: { children: string }) {
  return <span className="portfolio-moving-text"><span>{children}</span><span aria-hidden="true">{children}</span></span>
}

export const ShelfSelection = createContext<{
  expanded: string | null
  setExpanded: (id: string | null) => void
} | null>(null)

export default function PortfolioShelf({ title, introduction, children, loopCopies }: {
  title: string
  introduction: string
  children: ReactNode
  loopCopies?: ReactNode
}) {
  const shelf = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  const [expanded, setExpanded] = useState<string | null>(null)
  const loops = loopCopies != null

  useLayoutEffect(() => {
    const section = shelf.current
    const rail = track.current
    if (!section || !rail) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const group = rail.children[2] as HTMLElement | undefined
    const following = rail.children[3] as HTMLElement | undefined
    const span = () => loops && group && following ? following.offsetLeft - group.offsetLeft : 0
    const start = () => loops && group ? group.offsetLeft - rail.clientLeft - (rail.firstElementChild as HTMLElement).offsetLeft : 0
    if (loops) rail.scrollLeft = start()

    const trackScroll = () => {
      const width = span()
      if (width && (rail.scrollLeft < start() - width / 2 || rail.scrollLeft >= start() + width)) {
        const position = ((rail.scrollLeft - start()) % width + width) % width
        rail.scrollLeft = start() + position
      }
      const distance = motion.matches ? 0 : Math.min(30, Math.abs(rail.scrollLeft - start()) / 24)
      section.style.setProperty('--shelf-title-shift', `${distance}px`)
    }
    const scrollAcross = (event: WheelEvent) => {
      if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || rail.scrollWidth <= rail.clientWidth) return
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rail.clientWidth : 1
      rail.scrollLeft += event.deltaY * unit
      trackScroll()
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
  }, [loops])

  return (
    <section ref={shelf} className="portfolio-shelf" aria-labelledby="shelf-title">
      <header className="portfolio-shelf-intro">
        <h1 id="shelf-title">{title}</h1>
        <p>{introduction}</p>
      </header>
      <div ref={track} className="portfolio-shelf-track" tabIndex={0} aria-label={`${title} gallery`}>
        <ShelfSelection.Provider value={{ expanded, setExpanded }}>
          {loops ? [0, 1, 2, 3, 4].map(index => (
            <div key={index} className="portfolio-shelf-sequence" aria-hidden={index !== 2 || undefined}>
              {index === 2 ? children : loopCopies}
            </div>
          )) : children}
        </ShelfSelection.Provider>
      </div>
    </section>
  )
}
