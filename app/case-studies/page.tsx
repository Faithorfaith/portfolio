import Image from 'next/image'
import CaseStudyTransitionLink from '@/components/portfolio/case-study-transition-link'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import PortfolioShelf, { MovingText } from '@/components/portfolio/portfolio-shelf'
import { getPublicCaseStudyCards, getPublicProfile } from '@/lib/public-portfolio-data'
import { caseNames } from '@/lib/portfolio-titles'
import { replaceEmDashes } from '@/lib/content-utils'

export const metadata = { title: 'Case Studies - Faith Awokunle' }
export const revalidate = 300

export default async function CaseStudiesPage() {
  const [profile, caseStudies] = await Promise.all([getPublicProfile(), getPublicCaseStudyCards()])

  return (
    <main className="portfolio-shelf-page portfolio-case-index">
      <PortfolioHeader profile={profile} />
      <PortfolioShelf title="Case Studies" introduction="A closer look at the problems, decisions, and outcomes behind my product design work.">
        {caseStudies.map(study => (
          <CaseStudyTransitionLink key={study.id} href={`/case-studies/${encodeURIComponent(study.slug || study.id)}`} className="portfolio-opening-card" prefetch={false}>
            <h2><MovingText>{replaceEmDashes(caseNames[study.slug || ''] || study.title)}</MovingText></h2>
            <div className="portfolio-opening-cover">
              {study.thumbnail_url && <Image fill quality={60} src={study.thumbnail_url} alt="" sizes="(max-width: 640px) 78vw, 28vw" />}
            </div>
          </CaseStudyTransitionLink>
        ))}
        {!caseStudies.length && <p>No case studies are available yet.</p>}
      </PortfolioShelf>
    </main>
  )
}
