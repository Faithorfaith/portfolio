import type { ReactNode } from 'react'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import { getHomepagePortfolioData } from '@/lib/public-portfolio-data'

export default async function WritingLayout({ children }: { children: ReactNode }) {
  const { profile } = await getHomepagePortfolioData()

  return (
    <div className="portfolio-writing">
      <PortfolioHeader profile={profile} />
      {children}
    </div>
  )
}
