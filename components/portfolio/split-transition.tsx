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
      const top = svg.querySelectorAll('[data-split="top"]')
      const bottom = svg.querySelectorAll('[data-split="bottom"]')
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
      // Drive the same scroll timeline automatically, without overriding manual input.
      let scrollTween: gsap.core.Tween | undefined
      const timer = window.setTimeout(() => {
        const trigger = timeline.scrollTrigger
        if (!trigger || window.scrollY > trigger.start + 4 || window.location.hash) return
        const position = { y: window.scrollY }
        scrollTween = gsap.to(position, {
          y: trigger.end,
          duration: 1.6,
          ease: 'sine.inOut',
          onUpdate: () => window.scrollTo({ top: position.y, behavior: 'instant' }),
        })
      }, 3000)
      const cancel = () => { window.clearTimeout(timer); scrollTween?.kill() }
      window.addEventListener('wheel', cancel, { passive: true })
      window.addEventListener('touchstart', cancel, { passive: true })
      window.addEventListener('keydown', cancel)
      return () => {
        cancel()
        window.removeEventListener('wheel', cancel)
        window.removeEventListener('touchstart', cancel)
        window.removeEventListener('keydown', cancel)
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
