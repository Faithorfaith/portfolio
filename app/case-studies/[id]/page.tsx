import { Suspense } from 'react'
import CaseStudyClient from './case-study-client'

export default function CaseStudyPage() {
  return (
    <Suspense fallback={null}>
      <CaseStudyClient />
    </Suspense>
  )
}
