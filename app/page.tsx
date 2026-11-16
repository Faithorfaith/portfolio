import { getPublicCaseStudyCards, getPublicProfile } from '@/lib/public-portfolio-data'
import HomepageRedesign from '@/components/portfolio/homepage-redesign'

export const revalidate = 300

export default async function PortfolioPage() {
  const [profile, caseStudies] = await Promise.all([getPublicProfile(), getPublicCaseStudyCards()])
  return <HomepageRedesign profile={profile} caseStudies={caseStudies} />
}
