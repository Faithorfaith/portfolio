import PortfolioClient from './portfolio-client'
import { getPublicPortfolioData } from '@/lib/public-portfolio-data'

export default async function PortfolioPage() {
  const data = await getPublicPortfolioData()
  return <PortfolioClient {...data} />
}
