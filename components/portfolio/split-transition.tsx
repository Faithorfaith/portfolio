'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Original SVG geometry, grouped by its two vertical alignments. */
export default function SplitTransition() {
  const layer = useRef<SVGSVGElement>(null)
  const completed = useRef(false)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const svg = layer.current
    const section = svg?.parentElement
    if (!svg || !section) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (completed.current) { svg.style.display = 'none'; return }
      let openingTween: gsap.core.Timeline | undefined
      const top = svg.querySelectorAll('[data-split="top"]')
      const bottom = svg.querySelectorAll('[data-split="bottom"]')
      const completeOpening = (trigger?: ScrollTrigger) => {
        if (completed.current) return
        completed.current = true
        trigger?.kill()
        svg.style.display = 'none'
      }
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * 0.85}`,
          scrub: true,
          invalidateOnRefresh: true,
          onLeave: completeOpening,
        },
      })
      timeline.to(top, { y: -1630, ease: 'sine.inOut', duration: 1 }, 0)
        .to(bottom, { y: 1630, ease: 'sine.inOut', duration: 1 }, 0)
      // Open the layer in place after a short pause. The document itself never moves.
      const timer = window.setTimeout(() => {
        const trigger = timeline.scrollTrigger
        if (completed.current || !trigger || window.scrollY > trigger.start + 4 || window.location.hash) return
        trigger.kill()
        openingTween = gsap.timeline({ onComplete: () => completeOpening() })
          .to(top, { y: -1630, duration: 1.6, ease: 'sine.inOut' }, 0)
          .to(bottom, { y: 1630, duration: 1.6, ease: 'sine.inOut' }, 0)
      }, 3000)
      const cancelScheduledOpening = () => window.clearTimeout(timer)
      window.addEventListener('wheel', cancelScheduledOpening, { passive: true })
      window.addEventListener('touchstart', cancelScheduledOpening, { passive: true })
      window.addEventListener('keydown', cancelScheduledOpening)
      return () => {
        cancelScheduledOpening()
        openingTween?.kill()
        window.removeEventListener('wheel', cancelScheduledOpening)
        window.removeEventListener('touchstart', cancelScheduledOpening)
        window.removeEventListener('keydown', cancelScheduledOpening)
      }
    })
    return () => media.revert()
  }, [])

  return <svg ref={layer} className="featured-split-layer" viewBox="0 0 2444 1626" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <g data-split="top"><rect width="2444" height="814" fill="white" /></g>
    <g data-split="bottom"><rect y="812" width="2444" height="814" fill="white" /></g>
    <g data-split="top" fill="black">
      {[0, 2208, 1104, 552, 1656].map(x => <rect key={x} x={x} width="236" height="1433" />)}
    </g>
    <g data-split="bottom" fill="black">
      {[276, 1380, 828, 1932].map(x => <rect key={x} x={x} y="193" width="236" height="1433" />)}
    </g>
  </svg>
}
