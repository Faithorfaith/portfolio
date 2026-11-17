import type { Metadata } from 'next'
import CaseStudyClient from './case-study-client'
import { notFound } from 'next/navigation'
import { getPublicProfile, getPublicCaseStudyPage } from '@/lib/public-portfolio-data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ caseStudy }, profile] = await Promise.all([getPublicCaseStudyPage(id), getPublicProfile()])
  if (!caseStudy) notFound()
  return <CaseStudyClient initialCaseStudy={caseStudy} profile={profile} />
}
