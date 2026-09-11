'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Work } from './works-gallery'

const tileClass = 'w-[190px] aspect-[4/3]'
const cover = (work: Work) => work.thumbnail_url || (!work.media_type?.startsWith('video') ? work.media_url : null)

function ConveyorCard({ work, index, duplicate = false }: { work: Work; index: number; duplicate?: boolean }) {
  const image = cover(work)
  const video = work.media_type?.startsWith('video') && work.media_url
  return <Link href={`/playground?work=${encodeURIComponent(work.id)}`} aria-label={duplicate ? undefined : `View ${work.title} in Playground`} aria-hidden={duplicate || undefined} tabIndex={duplicate ? -1 : undefined} className={`playground-conveyor-card group relative block shrink-0 overflow-hidden rounded-md bg-foreground/5 ${tileClass}`}>
    {image ? <Image src={image.split('#')[0]} alt={duplicate ? '' : work.title} fill sizes="190px" className="object-cover" /> : video ? <video src={work.media_url || undefined} muted playsInline loop preload="metadata" onMouseEnter={event => void event.currentTarget.play()} onMouseLeave={event => { event.currentTarget.pause(); event.currentTarget.currentTime = 0 }} /> : <span className="grid h-full place-items-center p-3 text-center text-xs text-foreground/45" aria-hidden="true" />}
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
  const laneSize = Math.ceil(visible.length / 3)
  const lanes = [visible.slice(0, laneSize), visible.slice(laneSize, laneSize * 2), visible.slice(laneSize * 2)]

  return <section id="playground" className="portfolio-deferred playground-conveyor-section w-full py-12 scroll-mt-20" aria-labelledby="playground-preview-title">
    <div className="mx-auto mb-8 flex w-full max-w-2xl items-baseline justify-between px-5 sm:px-8">
      <h2 id="playground-preview-title" className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground">Playground</h2>
      <Link href="/playground" className="text-[11px] text-foreground/50 transition-colors hover:text-foreground">Explore all{hiddenCount > 0 ? ` +${hiddenCount}` : ''} ↗</Link>
    </div>
    <div className="playground-conveyor" aria-label="Playground highlights">
      {lanes.map((lane, index) => lane.length > 0 && <Lane key={index} works={lane} reverse={index % 2 === 1} />)}
    </div>
  </section>
}
