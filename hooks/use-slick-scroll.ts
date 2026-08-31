'use client'

import { RefObject, useEffect } from 'react'

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

export function useSlickElementScroll(ref: RefObject<HTMLElement | null>, refreshKey: unknown) {
  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let start = element.scrollTop
    let target = start
    let startedAt = 0

    const animate = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / 420)
      element.scrollTop = start + (target - start) * easeOutCubic(progress)
      if (progress < 1) frame = requestAnimationFrame(animate)
      else frame = 0
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      // Fine trackpad input already has excellent native momentum.
      if (event.deltaMode === 0 && Math.abs(event.deltaY) < 18) return
      event.preventDefault()
      if (frame) cancelAnimationFrame(frame)
      start = element.scrollTop
      target = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, start + event.deltaY * 1.15))
      startedAt = performance.now()
      frame = requestAnimationFrame(animate)
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      element.removeEventListener('wheel', onWheel)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref, refreshKey])
}

export function useSlickWindowScroll(enabled = true) {
  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    let start = window.scrollY
    let target = start
    let startedAt = 0

    const animate = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / 420)
      window.scrollTo(0, start + (target - start) * easeOutCubic(progress))
      if (progress < 1) frame = requestAnimationFrame(animate)
      else frame = 0
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      if (event.deltaMode === 0 && Math.abs(event.deltaY) < 18) return
      event.preventDefault()
      if (frame) cancelAnimationFrame(frame)
      start = window.scrollY
      const maximum = document.documentElement.scrollHeight - window.innerHeight
      target = Math.max(0, Math.min(maximum, start + event.deltaY * 1.15))
      startedAt = performance.now()
      frame = requestAnimationFrame(animate)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enabled])
}
