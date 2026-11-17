'use client'

import Image from 'next/image'
import { useContext } from 'react'
import { ShelfSelection } from './portfolio-shelf'

type Piece = { src: string; title: string; id: string }

export default function PlaygroundMosaic({ pieces, duplicate }: { pieces: Piece[]; duplicate?: boolean }) {
  const selection = useContext(ShelfSelection)

  return pieces.map(piece => {
    const active = piece.id === selection?.expanded
    return (
      <button
        key={piece.id}
        type="button"
        tabIndex={duplicate ? -1 : undefined}
        aria-label={piece.title}
        aria-pressed={active}
        className="portfolio-archive-piece"
        onTransitionEnd={event => {
          if (event.currentTarget === document.activeElement && active && event.target === event.currentTarget && event.propertyName === 'flex-basis') {
            event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
          }
        }}
        onClick={event => {
          const button = event.currentTarget
          selection?.setExpanded(active ? null : piece.id)
          if (!active) requestAnimationFrame(() => button.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
        }}
      >
        <Image fill src={piece.src} alt="" sizes="(max-width: 640px) 82vw, 52vw" />
      </button>
    )
  })
}
