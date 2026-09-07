import Link from 'next/link'
import type { HomeWriting } from '@/lib/public-portfolio-data'
import { slugify } from '@/lib/slugify'

export default function HomeWritingPreview({ writings }: { writings: HomeWriting[] }) {
  if (!writings.length) return null
  return <section id="writing" className="portfolio-deferred w-full max-w-2xl mx-auto px-5 sm:px-8 py-12 scroll-mt-20" aria-labelledby="home-writing-title">
    <h2 id="home-writing-title" className="mb-8 text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground">My articles</h2>
    <div className="article-index">
      {writings.map(writing => <Link key={writing.id} href={`/writing/${encodeURIComponent(slugify(writing.title) || writing.slug)}`} className="article-index-link group">
        <div className="article-index-row">
          <h3>{writing.title}</h3>
          <span className="article-index-time">{writing.readingMinutes} min read</span>
          <span className="article-index-year">{new Date(writing.created_at).getFullYear()}</span>
        </div>
      </Link>)}
    </div>
  </section>
}
