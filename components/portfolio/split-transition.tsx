'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Original SVG geometry, grouped by its two vertical alignments. */
export default function SplitTransition() {
  const layer = useRef<SVGSVGElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const svg = layer.current
    const section = svg?.parentElement
    if (!svg || !section) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const top = svg.querySelector('[data-split="top"]')
      const bottom = svg.querySelector('[data-split="bottom"]')
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * 0.85}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      timeline.to(top, { y: -1630, ease: 'sine.inOut', duration: 1 }, 0)
        .to(bottom, { y: 1630, ease: 'sine.inOut', duration: 1 }, 0)
    })
    return () => media.revert()
  }, [])

  return <svg ref={layer} className="featured-split-layer" viewBox="0 0 2444 1626" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <g data-split="top" fill="black">
      {[0, 2208, 1104, 552, 1656].map(x => <rect key={x} x={x} width="236" height="1433" />)}
    </g>
    <g data-split="bottom" fill="black">
      {[276, 1380, 828, 1932].map(x => <rect key={x} x={x} y="193" width="236" height="1433" />)}
    </g>
  </svg>
}
