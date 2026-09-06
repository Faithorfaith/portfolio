'use client'
import ProgressiveImage from './progressive-image'

export default function ArticleRowContent({ title, excerpt, cover, minutes, year }: { title: string; excerpt: string | null; cover: string | null; minutes: number; year: number }) {
  return <>
    <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
      {cover && <ProgressiveImage src={cover} alt="" fill className="object-cover" containerClassName="w-full h-full" />}
    </div>
    <div className="min-w-0">
      <h3 className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground/85 group-hover:text-foreground transition-colors">{title}</h3>
      {excerpt && <p className="mt-1 text-sm leading-relaxed text-foreground/60 line-clamp-2">{excerpt}</p>}
      <p className="mt-2 text-[11px] text-foreground/60 tabular-nums">{minutes} min · {year}</p>
    </div>
    <span className="text-lg text-foreground/50 transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true">↗</span>
  </>
}
