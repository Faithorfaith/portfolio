'use client'

import Link from 'next/link'
import type { HomeWriting } from '@/lib/public-portfolio-data'
import { slugify } from '@/lib/slugify'
import { useState } from 'react'

export default function HomeWritingPreview({ writings }: { writings: HomeWriting[] }) {
  const [randomNote, setRandomNote] = useState<HomeWriting | null>(null)
  if (!writings.length) return null
  return <section id="writing" className="portfolio-deferred w-full max-w-4xl mx-auto px-5 sm:px-8 py-12 scroll-mt-20" aria-labelledby="home-writing-title">
    <div className="mb-8 flex items-baseline justify-between"><h2 id="home-writing-title" className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground">Notes from my desk</h2><button type="button" className="random-note-button" onClick={() => setRandomNote(writings[Math.floor(Math.random() * writings.length)])}>Random note ↗</button></div>
    {randomNote && <Link className="random-note" href={`/writing/${encodeURIComponent(slugify(randomNote.title) || randomNote.slug)}`}><span>From the desk</span>{randomNote.title}</Link>}
    <div className="article-index">
      {writings.map((writing) => <Link key={writing.id} href={`/writing/${encodeURIComponent(slugify(writing.title) || writing.slug)}`} className="article-index-link group">
        <div className="article-index-row">
          <h3>{writing.title}</h3>
          <span className="article-index-time">{writing.readingMinutes} min read</span>
          <span className="article-index-year">{new Date(writing.created_at).getFullYear()}</span>
        </div>
      </Link>)}
    </div>
  </section>
}
