import WritingSection from '@/components/portfolio/writing-section'
import { getPublicPortfolioData } from '@/lib/public-portfolio-data'
import type { Metadata } from 'next'
import { slugify } from '@/lib/slugify'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { writings } = await getPublicPortfolioData()
  const requestedSlug = decodeURIComponent(slug)
  const article = writings.find((item) => item.slug === requestedSlug || slugify(item.title) === requestedSlug)
  if (!article) return { title: 'Writing — Faith Awokunle' }
  return {
    title: `${article.title} — Faith Awokunle`,
    description: article.excerpt || `An article by Faith Awokunle: ${article.title}`,
    openGraph: {
      title: article.title,
      description: article.excerpt || `An article by Faith Awokunle: ${article.title}`,
      type: 'article',
      images: article.cover_image ? [article.cover_image] : undefined,
    },
  }
}

export default async function WritingArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { writings } = await getPublicPortfolioData()
  return <WritingSection variant="full" initialSlug={decodeURIComponent(slug)} initialWritings={writings} />
}
