import Image from 'next/image'
import Link from 'next/link'
import PortfolioShelf, { MovingText } from '@/components/portfolio/portfolio-shelf'
import { getPublicWritings } from '@/lib/public-portfolio-data'
import { slugify } from '@/lib/slugify'

export const metadata = {
  title: 'My Writings - Faith Awokunle',
  description: 'Writing about product design, technology, and the craft of making complex things clear.',
}

export default async function WritingPage() {
  const writings = await getPublicWritings()

  return (
    <main className="portfolio-shelf-page">
      <PortfolioShelf title="My Writings" introduction="Notes on product design, technology, and making complex things clear.">
        {writings.map((writing, index) => (
          <Link key={writing.id} href={`/writing/${encodeURIComponent(writing.slug || slugify(writing.title))}`} className={`portfolio-book book-tone-${index % 3}`}>
            <span className="portfolio-book-front">
              {writing.cover_image && <Image fill src={writing.cover_image} alt="" sizes="(max-width: 640px) 68vw, 24vw" />}
              <span className="portfolio-book-copy">
                <strong><MovingText>{writing.title}</MovingText></strong>
                <span>Faith Awokunle</span>
              </span>
            </span>
          </Link>
        ))}
        {!writings.length && <p>No writings have been published yet.</p>}
      </PortfolioShelf>
    </main>
  )
}
