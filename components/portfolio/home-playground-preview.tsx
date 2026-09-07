import Image from 'next/image'
import Link from 'next/link'
import type { Work } from './works-gallery'

const shapes = ['aspect-[4/5]', 'aspect-square', 'aspect-[3/4]', 'aspect-[5/4]', 'aspect-[2/3]']
const cover = (work: Work) => work.thumbnail_url || (!work.media_type?.startsWith('video') ? work.media_url : null)

export default function HomePlaygroundPreview({ works, hiddenCount }: { works: Work[]; hiddenCount: number }) {
  if (!works.length) return null
  const visible = works.slice(0, 14)
  return <section id="playground" className="portfolio-deferred w-full max-w-2xl mx-auto px-5 sm:px-8 py-12 scroll-mt-20" aria-labelledby="playground-preview-title">
    <h2 id="playground-preview-title" className="mb-8 text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground">Playground</h2>
    <div className="columns-2 gap-2.5 sm:columns-3">
      {visible.map((work, index) => {
        const image = cover(work)
        return <Link key={work.id} href={`/playground?work=${encodeURIComponent(work.id)}`} aria-label={`View ${work.title} in Playground`} className={`group relative mb-2.5 block w-full break-inside-avoid ${shapes[index % shapes.length]} overflow-hidden rounded-md bg-foreground/5 ring-1 ring-transparent transition-[box-shadow,filter] hover:brightness-[0.98] hover:ring-foreground/25`}>
          {image ? <Image src={image.split('#')[0]} alt={work.title} fill sizes="(max-width: 640px) 46vw, 210px" className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" /> : <span className="grid h-full place-items-center p-3 text-center text-[11px] text-foreground/45">{work.title}</span>}
        </Link>
      })}
      {hiddenCount > 0 && <Link href="/playground" className="group relative mb-2.5 grid aspect-[4/5] w-full break-inside-avoid place-items-center overflow-hidden rounded-md bg-foreground/[0.055] text-foreground/65 ring-1 ring-transparent hover:ring-foreground/25" aria-label={`View all Playground work, ${hiddenCount} more items`}>
        <span className="text-center"><span className="block text-sm">+{hiddenCount}</span><span className="mt-1 block text-[11px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">View all ↗</span></span>
      </Link>}
    </div>
  </section>
}
