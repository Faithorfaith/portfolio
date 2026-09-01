import WorksGallery from '@/components/portfolio/works-gallery'
import { getPublicPortfolioData } from '@/lib/public-portfolio-data'

export const metadata = {
  title: 'Playground — Faith Awokunle',
  description: 'Design experiments, visual explorations, and independent projects by Faith Awokunle.',
}

export default async function PlaygroundPage() {
  const { works } = await getPublicPortfolioData()
  return <WorksGallery variant="full" initialWorks={works} />
}
