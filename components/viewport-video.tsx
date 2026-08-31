'use client'

import { useEffect, useRef } from 'react'

export default function ViewportVideo({
  src,
  poster,
  controls = false,
  decorative = false,
  className = 'w-full h-auto',
}: {
  src: string
  poster?: string
  controls?: boolean
  decorative?: boolean
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.pause()
      else if (decorative && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) void video.play().catch(() => {})
    }, { threshold: 0.35 })
    observer.observe(video)
    return () => observer.disconnect()
  }, [decorative])

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      controls={controls}
      muted={decorative}
      loop={decorative}
      playsInline
      preload="metadata"
      className={className}
    />
  )
}
