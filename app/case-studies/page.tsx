import Image from 'next/image'
import CaseStudyTransitionLink from '@/components/portfolio/case-study-transition-link'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import PortfolioShelf, { MovingText } from '@/components/portfolio/portfolio-shelf'
import { getHomepagePortfolioData } from '@/lib/public-portfolio-data'
import { caseNames } from '@/lib/portfolio-titles'

export const metadata = { title: 'Case Studies - Faith Awokunle' }
export const revalidate = 300

export default async function CaseStudiesPage() {
  const { profile, caseStudies } = await getHomepagePortfolioData()
  const published = caseStudies.filter(study => study.published)

  return (
    <main className="portfolio-shelf-page portfolio-case-index">
      <PortfolioHeader profile={profile} />
      <PortfolioShelf title="Case Studies" introduction="A closer look at the problems, decisions, and outcomes behind my product design work.">
        {published.map(study => (
          <CaseStudyTransitionLink key={study.id} href={`/case-studies/${encodeURIComponent(study.slug || study.id)}`} className="portfolio-opening-card">
            <h2><MovingText>{caseNames[study.slug || ''] || study.title}</MovingText></h2>
            <div className="portfolio-opening-cover">
              {study.thumbnail_url && <Image fill src={study.thumbnail_url} alt="" sizes="(max-width: 640px) 78vw, 28vw" />}
            </div>
          </CaseStudyTransitionLink>
        ))}
        {!published.length && <p>No case studies are available yet.</p>}
      </PortfolioShelf>
    </main>
  )
}
