'use client'

import Image from 'next/image'
import CaseStudyTransitionLink from '@/components/portfolio/case-study-transition-link'
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { CaseStudy, Profile } from './profile-section'
import { caseNames } from '@/lib/portfolio-titles'
import PortfolioHeader from './portfolio-header'
import { MovingText } from './portfolio-shelf'

type Props = { profile: Profile | null; caseStudies: CaseStudy[] }

export default function HomepageRedesign({ profile, caseStudies }: Props) {
  const rail = useRef<HTMLElement>(null)
  const cards = caseStudies.filter(study => study.published).map(study => ({
    key: study.id,
    title: caseNames[study.slug || ''] || study.title,
    cover: study.thumbnail_url,
    href: `/case-studies/${encodeURIComponent(study.slug || study.id)}`,
  }))
  // Four cards cover the viewport at both gallery breakpoints.
  const loops = cards.length >= 4

  useLayoutEffect(() => {
    const element = rail.current
    if (!element || !loops) return
    const first = element.children[0] as HTMLElement
    const middle = element.children[1] as HTMLElement
    let span = 0

    const measure = () => {
      const offset = span ? (element.scrollLeft % span + span) % span : 0
      const progress = span ? offset / span : 0
      span = middle.offsetLeft - first.offsetLeft
      if (span > 0) element.scrollLeft = span * (1 + progress)
    }
    const wrap = () => {
      if (!span) return
      if (element.scrollLeft < span / 4) element.scrollLeft += span
      else if (element.scrollLeft >= 2 * span) element.scrollLeft -= span
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    element.addEventListener('scroll', wrap, { passive: true })
    return () => {
      observer.disconnect()
      element.removeEventListener('scroll', wrap)
    }
  }, [loops, cards.length])

  useEffect(() => {
    const element = rail.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || element.scrollWidth <= element.clientWidth) return
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1
      element.scrollLeft += event.deltaY * unit
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <main className="portfolio-opening">
      <h1 className="sr-only">{profile?.full_name || 'Faith Awokunle'} portfolio</h1>
      <PortfolioHeader profile={profile} />

      <section ref={rail} id="featured" className="portfolio-opening-work" aria-label="Case studies" tabIndex={0}>
        {cards.length === 0 && <p>No work is available right now.</p>}
        {(loops ? [0, 1, 2] : [1]).map(group => (
          <div className="portfolio-opening-sequence" key={group} aria-hidden={group !== 1 || undefined}>
            {cards.map((card, index) => {
              const content = (
                <>
                  <h2 title={card.title}><MovingText>{card.title}</MovingText></h2>
                  <div className="portfolio-opening-cover">
                    {card.cover && (
                      <Image
                        fill
                        sizes="(max-width: 640px) 78vw, 27.6vw"
                        quality={60}
                        loading={group === 1 && index === 0 ? 'eager' : 'lazy'}
                        fetchPriority={group === 1 && index === 0 ? 'high' : 'auto'}
                        src={card.cover}
                        alt=""
                      />
                    )}
                  </div>
                </>
              )

              return <CaseStudyTransitionLink key={card.key} className="portfolio-opening-card" href={card.href} tabIndex={group === 1 ? undefined : -1} prefetch={false}>{content}</CaseStudyTransitionLink>
            })}
          </div>
        ))}
      </section>
    </main>
  )
}
