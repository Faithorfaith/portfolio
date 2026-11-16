'use client'

import Image from 'next/image'
import { useState } from 'react'

type Piece = { src: string; title: string; id: string }

export default function PlaygroundMosaic({ pieces }: { pieces: Piece[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return pieces.map(piece => {
    const active = piece.id === expanded
    return (
      <button
        key={piece.id}
        type="button"
        aria-label={piece.title}
        aria-pressed={active}
        className="portfolio-archive-piece"
        onTransitionEnd={event => {
          if (active && event.target === event.currentTarget && event.propertyName === 'flex-basis') {
            event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
          }
        }}
        onClick={event => {
          const button = event.currentTarget
          setExpanded(active ? null : piece.id)
          if (!active) requestAnimationFrame(() => button.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
        }}
      >
        <Image fill src={piece.src} alt="" sizes="(max-width: 640px) 82vw, 52vw" />
      </button>
    )
  })
}
