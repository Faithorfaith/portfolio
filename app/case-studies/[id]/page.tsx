import CaseStudyClient from './case-study-client'
import { notFound } from 'next/navigation'
import { getHomepagePortfolioData, getPublicCaseStudyLinks, getPublicCaseStudyPage } from '@/lib/public-portfolio-data'

export const revalidate = 300

export async function generateStaticParams() {
  const links = await getPublicCaseStudyLinks()
  return links.map(study => ({ id: study.slug || study.id }))
}

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ caseStudy }, { profile }] = await Promise.all([getPublicCaseStudyPage(id), getHomepagePortfolioData()])
  if (!caseStudy) notFound()
  return <CaseStudyClient initialCaseStudy={caseStudy} profile={profile} />
}
