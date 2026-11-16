import type { ReactNode } from 'react'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import { getPublicProfile } from '@/lib/public-portfolio-data'

export default async function WritingLayout({ children }: { children: ReactNode }) {
  const profile = await getPublicProfile()

  return (
    <div className="portfolio-writing">
      <PortfolioHeader profile={profile} />
      {children}
    </div>
  )
}
