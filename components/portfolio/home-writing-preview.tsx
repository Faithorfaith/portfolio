import Image from 'next/image'
import Link from 'next/link'
import type { HomeWriting } from '@/lib/public-portfolio-data'
import { slugify } from '@/lib/slugify'

export default function HomeWritingPreview({ writings }: { writings: HomeWriting[] }) {
  if (!writings.length) return null
  return <section id="writing" className="portfolio-deferred w-full max-w-2xl mx-auto px-5 sm:px-8 py-12 scroll-mt-20" aria-labelledby="home-writing-title">
    <h2 id="home-writing-title" className="mb-8 text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground">My articles</h2>
    <div className="space-y-2">
      {writings.map(writing => <Link key={writing.id} href={`/writing/${encodeURIComponent(slugify(writing.title) || writing.slug)}`} className="group grid w-full grid-cols-[88px_minmax(0,1fr)_20px] items-center gap-4 py-3 text-left md:grid-cols-[112px_minmax(0,1fr)_24px] md:gap-5">
        <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
          {writing.cover_image && <Image src={writing.cover_image.split('#')[0]} alt="" fill sizes="(max-width: 640px) 88px, 112px" className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" />}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground/85 transition-colors group-hover:text-foreground">{writing.title}</h3>
          {writing.excerpt && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-foreground/60">{writing.excerpt}</p>}
          <p className="mt-2 text-[11px] tabular-nums text-foreground/60">{writing.readingMinutes} min · {new Date(writing.created_at).getFullYear()}</p>
        </div>
        <span className="text-lg text-foreground/45 transition-transform group-hover:translate-x-0.5" aria-hidden="true">↗</span>
      </Link>)}
    </div>
  </section>
}
