import CaseStudyClient from './case-study-client'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slugify'

export const dynamic = 'force-dynamic'

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const linksRequest = supabase.from('case_studies').select('id, title, slug, order_index, created_at').eq('published', true).order('order_index', { ascending: true })
  const bySlug = await supabase.from('case_studies').select('*').eq('slug', id).eq('published', true).maybeSingle()
  let caseStudy = bySlug.data
  if (!caseStudy && /^[0-9a-f-]{36}$/i.test(id)) {
    const byId = await supabase.from('case_studies').select('*').eq('id', id).eq('published', true).maybeSingle()
    caseStudy = byId.data
  }
  if (!caseStudy) {
    const legacy = await supabase.from('case_studies').select('*').eq('published', true)
    caseStudy = legacy.data?.find(study => slugify(study.title) === id) || null
  }
  const { data: links, error: linksError } = await linksRequest
  if (bySlug.error || linksError) throw new Error('Could not load case study')
  if (!caseStudy) notFound()
  return <CaseStudyClient initialCaseStudy={caseStudy} initialLinks={links || []} />
}
