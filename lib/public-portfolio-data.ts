import 'server-only'

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Profile, CaseStudy } from '@/components/portfolio/profile-section'
import type { Project } from '@/components/portfolio/projects-section'
import type { Work } from '@/components/portfolio/works-gallery'
import type { Writing } from '@/components/portfolio/writing-section'
import type { WorkflowFile } from '@/lib/workflow-files'
import { slugify } from '@/lib/slugify'
import type { CaseStudy as CaseStudyPageData } from '@/app/case-studies/[id]/case-study-client'

type PortfolioData = { profile: Profile | null; caseStudies: CaseStudy[]; projects: Project[]; works: Work[]; writings: Writing[] }

const publicClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null
}

export const getPublicWritings = async (): Promise<Writing[]> => {
  const supabase = publicClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('writings')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Unable to load public writings: ${error.message}`)
  return ((data || []).map(writing => {
    let content = writing.content || []
    if (typeof content === 'string') {
      try { content = JSON.parse(content) } catch { content = [] }
    }
    return { ...writing, content }
  }) as Writing[])
}

export const getPublicWorks = unstable_cache(async (): Promise<Work[]> => {
  const supabase = publicClient()
  if (!supabase) return []
  const { data } = await supabase.from('portfolio_works').select('id, title, description, media_url, media_type, thumbnail_url, order_index, created_at, type').order('created_at', { ascending: false })
  return (data as Work[] | null) ?? []
}, ['public-works-v3'], { revalidate: 300, tags: ['public-works'] })

export async function getPublicCaseStudyPage(identifier: string): Promise<{
  caseStudy: CaseStudyPageData | null
}> {
  const supabase = publicClient()
  if (!supabase) return { caseStudy: null }

  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
  const detailRequest = isId
    ? supabase.from('case_studies').select('*').eq('id', identifier).eq('published', true).maybeSingle()
    : supabase.from('case_studies').select('*').eq('slug', identifier).eq('published', true).maybeSingle()

  const detailResult = await detailRequest
  if (detailResult.error) throw new Error(`Unable to load case study: ${detailResult.error.message}`)

  let caseStudy = detailResult.data as CaseStudyPageData | null
  // Older entries may predate the slug column. Use the wider query only when the direct lookup misses.
  if (!caseStudy && !isId) {
    const { data, error } = await supabase.from('case_studies').select('*').eq('published', true)
    if (error) throw new Error(`Unable to load legacy case study: ${error.message}`)
    caseStudy = ((data || []).find(study => slugify(study.title) === identifier) as CaseStudyPageData | undefined) ?? null
  }

  return { caseStudy }
}

export type HomeWriting = Pick<Writing, 'id' | 'title' | 'slug' | 'excerpt' | 'cover_image' | 'created_at'> & { readingMinutes: number }

export const getPublicWorkflowFiles = unstable_cache(async (): Promise<WorkflowFile[]> => {
  const supabase = publicClient()
  if (!supabase) return []
  const { data } = await supabase.from('workflow_files').select('*, workflow_file_versions(*)').eq('published', true).order('updated_at', { ascending: false })
  return ((data || []).map(file => ({ ...file, workflow_file_versions: [...(file.workflow_file_versions || [])].sort((a, b) => b.version_number - a.version_number) })) as WorkflowFile[])
}, ['public-workflow-files-v1'], { revalidate: 60 })

export const getPublicProfile = unstable_cache(async (): Promise<Profile | null> => {
  const supabase = publicClient()
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('*').limit(1).maybeSingle()
  if (error) throw new Error(`Unable to load public profile: ${error.message}`)
  return data as Profile | null
}, ['portfolio-profile'], { revalidate: 300 })

export const getPublicCaseStudyCards = unstable_cache(async (): Promise<CaseStudy[]> => {
  const supabase = publicClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('case_studies')
    .select('id, slug, title, excerpt, thumbnail_url, published, order_index, created_at')
    .eq('published', true)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(`Unable to load case study cards: ${error.message}`)
  return data as CaseStudy[]
}, ['portfolio-case-study-cards-v3'], { revalidate: 300, tags: ['public-case-studies'] })

export const getPublicPortfolioData = unstable_cache(async (): Promise<PortfolioData> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { profile: null, caseStudies: [], projects: [], works: [], writings: [] }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [profileResult, caseStudiesResult, projectsResult, worksResult, writingsResult] = await Promise.all([
    supabase.from('profiles').select('*').limit(1).maybeSingle(),
    supabase.from('case_studies').select('id, slug, title, excerpt, thumbnail_url, published, order_index, created_at').eq('published', true).order('updated_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }),
    supabase.from('projects').select('id, title, year, type, link, description, cover_image, created_at').order('created_at', { ascending: false }),
    supabase.from('portfolio_works').select('id, title, description, media_url, media_type, thumbnail_url, order_index, created_at, type').order('created_at', { ascending: false }),
    supabase.from('writings').select('*').order('created_at', { ascending: false }),
  ])

  return {
    profile: (profileResult.data as Profile | null) ?? null,
    caseStudies: (caseStudiesResult.data as CaseStudy[] | null) ?? [],
    projects: (projectsResult.data as Project[] | null) ?? [],
    works: (worksResult.data as Work[] | null) ?? [],
    writings: ((writingsResult.data || []).map((writing) => ({ ...writing, content: typeof writing.content === 'string' ? JSON.parse(writing.content) : (writing.content || []) })) as Writing[]),
  }
}, ['public-portfolio-data-v2'], { revalidate: 300, tags: ['public-case-studies'] })
