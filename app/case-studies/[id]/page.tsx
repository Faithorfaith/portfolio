import { Suspense } from 'react'
import CaseStudyClient from './case-study-client'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slugify'

export const dynamic = 'force-dynamic'

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('case_studies').select('id, slug, title').eq('published', true)
  if (error) throw new Error('Could not verify case study availability')
  if (!data?.some(study => study.id === id || study.slug === id || slugify(study.title) === id)) notFound()
  return (
    <Suspense fallback={<div className="min-h-screen bg-background animate-pulse" aria-label="Loading case study" />}>
      <CaseStudyClient />
    </Suspense>
  )
}
