import { getHomepagePortfolioData } from '@/lib/public-portfolio-data'
import HomepageRedesign from '@/components/portfolio/homepage-redesign'

export const revalidate = 300

export default async function PortfolioPage() {
  const data = await getHomepagePortfolioData()
  return <HomepageRedesign profile={data.profile} caseStudies={data.caseStudies} projects={data.projects} works={data.works} />
}
