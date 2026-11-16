import PlaygroundMosaic from '@/components/portfolio/playground-mosaic'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import PortfolioShelf from '@/components/portfolio/portfolio-shelf'
import { getHomepagePortfolioData, getPublicWorks } from '@/lib/public-portfolio-data'
import { playgroundNames } from '@/lib/portfolio-titles'

export const metadata = { title: 'Playground - Faith Awokunle' }
export const revalidate = 300

export default async function PlaygroundPage() {
  const [{ profile }, works] = await Promise.all([getHomepagePortfolioData(), getPublicWorks()])
  const pieces = works.flatMap(work => {
    if (work.media_type?.startsWith('video')) return []
    const src = work.thumbnail_url || (work.media_type?.startsWith('image') ? work.media_url : null)
    return src ? [{ src, id: work.id, title: playgroundNames[work.id] || work.title || 'Visual study' }] : []
  })

  return (
    <main className="portfolio-shelf-page portfolio-playground-page">
      <PortfolioHeader profile={profile} />
      <PortfolioShelf title="Playground" introduction="Visual experiments, design explorations, and side projects.">
        <PlaygroundMosaic pieces={pieces} />
        {!pieces.length && <p>No Playground pieces are available yet.</p>}
      </PortfolioShelf>
    </main>
  )
}
