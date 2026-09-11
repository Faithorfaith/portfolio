import WritingSection from '@/components/portfolio/writing-section'
import { getPublicWritings } from '@/lib/public-portfolio-data'

export const metadata = {
  title: 'Writing - Faith Awokunle',
  description: 'Writing about product design, technology, and the craft of making complex things clear.',
}

export default async function WritingPage() {
  const writings = await getPublicWritings()
  return <WritingSection variant="full" initialWritings={writings} />
}
