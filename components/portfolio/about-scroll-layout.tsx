'use client'

import Image from 'next/image'
import ViewportVideo from '@/components/viewport-video'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export default function AboutScrollLayout({ photos, video, name, children }: {
  photos: string[]
  video?: string
  name: string
  children: ReactNode
}) {
  const mediaCount = video ? 1 : photos.length
  const copy = useRef<HTMLDivElement>(null)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    if (mediaCount < 2) return
    const sections = Array.from(copy.current?.querySelectorAll<HTMLElement>('[data-about-panel]') || [])
    let frame = 0
    const update = () => {
      const line = window.innerHeight * .52
      let active = 0
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= line) active = index
      })
      setActivePhoto(Math.min(active, mediaCount - 1))
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [mediaCount])

  return (
    <div className={`portfolio-about-grid${mediaCount ? ' has-photos' : ''}`}>
      {mediaCount > 0 && (
        <figure className="portfolio-about-photo-rail">
          <div className="portfolio-about-portrait">
            {video ? (
              <ViewportVideo src={video} poster={photos[0]} decorative className="h-full w-full object-cover" />
            ) : photos.map((src, index) => (
              <Image
                key={src}
                fill
                src={src}
                alt={index === activePhoto ? (index === 0 ? name : `From ${name}’s photo gallery`) : ''}
                aria-hidden={index !== activePhoto || undefined}
                data-active={index === activePhoto}
                sizes="(max-width: 640px) 52vw, 260px"
              />
            ))}
          </div>
        </figure>
      )}
      <div className="portfolio-about-copy" ref={copy}>{children}</div>
    </div>
  )
}
