import { Suspense } from 'react'
import CaseStudyClient from './case-study-client'

export default function CaseStudyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background animate-pulse" aria-label="Loading case study" />}>
      <CaseStudyClient />
    </Suspense>
  )
}
