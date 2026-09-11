'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Work } from './works-gallery'

const widths = ['w-[210px]', 'w-[150px]', 'w-[250px]', 'w-[180px]', 'w-[225px]']
const ratios = ['aspect-[4/3]', 'aspect-square', 'aspect-[16/10]', 'aspect-[3/4]', 'aspect-[5/3]']
const cover = (work: Work) => work.thumbnail_url || (!work.media_type?.startsWith('video') ? work.media_url : null)

function ConveyorCard({ work, index, duplicate = false }: { work: Work; index: number; duplicate?: boolean }) {
  const image = cover(work)
  const video = work.media_type?.startsWith('video') && work.media_url
  return <Link href={`/playground?work=${encodeURIComponent(work.id)}`} aria-label={duplicate ? undefined : `View ${work.title} in Playground`} aria-hidden={duplicate || undefined} tabIndex={duplicate ? -1 : undefined} className={`playground-conveyor-card group relative block shrink-0 overflow-hidden rounded-md bg-foreground/5 ${widths[index % widths.length]} ${ratios[index % ratios.length]}`}>
    {image ? <Image src={image.split('#')[0]} alt={duplicate ? '' : work.title} fill sizes="250px" className="object-cover" /> : video ? <video src={work.media_url || undefined} muted playsInline loop preload="metadata" onMouseEnter={event => void event.currentTarget.play()} onMouseLeave={event => { event.currentTarget.pause(); event.currentTarget.currentTime = 0 }} /> : <span className="grid h-full place-items-center p-3 text-center text-xs text-foreground/45">{work.title}</span>}
    <span className="playground-conveyor-caption"><strong>{work.title}</strong>{work.type && <small>{work.type}</small>}</span>
  </Link>
}

function Lane({ works, reverse = false }: { works: Work[]; reverse?: boolean }) {
  return <div className={`playground-conveyor-lane ${reverse ? 'is-reverse' : ''}`}>
    <div className="playground-conveyor-track">
      {[false, true].map(duplicate => <div key={String(duplicate)} className="playground-conveyor-set" aria-hidden={duplicate || undefined}>
        {works.map((work, index) => <ConveyorCard key={`${duplicate ? 'copy' : 'item'}-${work.id}`} work={work} index={index + (reverse ? 2 : 0)} duplicate={duplicate} />)}
      </div>)}
    </div>
  </div>
}

export default function HomePlaygroundPreview({ works, hiddenCount }: { works: Work[]; hiddenCount: number }) {
  if (!works.length) return null
  const visible = works.slice(0, 14)
  const midpoint = Math.ceil(visible.length / 2)
  const firstLane = visible.slice(0, midpoint)
  const secondLane = visible.slice(midpoint)

  return <section id="playground" className="portfolio-deferred playground-conveyor-section w-full py-12 scroll-mt-20" aria-labelledby="playground-preview-title">
    <div className="mx-auto mb-8 flex w-full max-w-2xl items-baseline justify-between px-5 sm:px-8">
      <h2 id="playground-preview-title" className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground">Playground</h2>
      <Link href="/playground" className="text-[11px] text-foreground/50 transition-colors hover:text-foreground">Explore all{hiddenCount > 0 ? ` +${hiddenCount}` : ''} ↗</Link>
    </div>
    <div className="playground-conveyor" aria-label="Playground highlights">
      <Lane works={firstLane} />
      {secondLane.length > 0 && <Lane works={secondLane} reverse />}
    </div>
  </section>
}
