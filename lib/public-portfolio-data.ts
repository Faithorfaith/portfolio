import 'server-only'

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Profile, CaseStudy } from '@/components/portfolio/profile-section'
import type { Project } from '@/components/portfolio/projects-section'
import type { Work } from '@/components/portfolio/works-gallery'
import type { Writing } from '@/components/portfolio/writing-section'
import type { WorkflowFile } from '@/lib/workflow-files'
import { slugify } from '@/lib/slugify'
import type { CaseStudy as CaseStudyPageData, CaseStudyLink } from '@/app/case-studies/[id]/case-study-client'

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
}, ['public-works-v2'], { revalidate: 300 })

export const getPublicCaseStudyLinks = unstable_cache(async (): Promise<CaseStudyLink[]> => {
  const supabase = publicClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('case_studies')
    .select('id, title, slug, order_index, created_at')
    .eq('published', true)
    .order('order_index', { ascending: true })
  if (error) throw new Error(`Unable to load case study links: ${error.message}`)
  return (data as CaseStudyLink[] | null) ?? []
}, ['public-case-study-links-v1'], { revalidate: 300 })

export const getPublicCaseStudyPage = unstable_cache(async (identifier: string): Promise<{
  caseStudy: CaseStudyPageData | null
  links: CaseStudyLink[]
}> => {
  const supabase = publicClient()
  if (!supabase) return { caseStudy: null, links: [] }

  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
  const detailRequest = isId
    ? supabase.from('case_studies').select('*').eq('id', identifier).eq('published', true).maybeSingle()
    : supabase.from('case_studies').select('*').eq('slug', identifier).eq('published', true).maybeSingle()

  const [detailResult, linksResult] = await Promise.all([
    detailRequest,
    supabase.from('case_studies').select('id, title, slug, order_index, created_at').eq('published', true).order('order_index', { ascending: true }),
  ])
  if (detailResult.error) throw new Error(`Unable to load case study: ${detailResult.error.message}`)
  if (linksResult.error) throw new Error(`Unable to load case study links: ${linksResult.error.message}`)

  let caseStudy = detailResult.data as CaseStudyPageData | null
  // Older entries may predate the slug column. Keep that compatibility path cached
  // and only pay for the wider query when the direct lookup misses.
  if (!caseStudy && !isId) {
    const { data, error } = await supabase.from('case_studies').select('*').eq('published', true)
    if (error) throw new Error(`Unable to load legacy case study: ${error.message}`)
    caseStudy = ((data || []).find(study => slugify(study.title) === identifier) as CaseStudyPageData | undefined) ?? null
  }

  return {
    caseStudy,
    links: (linksResult.data as CaseStudyLink[] | null) ?? [],
  }
}, ['public-case-study-page-v1'], { revalidate: 300 })

export type HomeWriting = Pick<Writing, 'id' | 'title' | 'slug' | 'excerpt' | 'cover_image' | 'created_at'> & { readingMinutes: number }
export type HomepagePortfolioData = Omit<PortfolioData, 'works' | 'writings'> & { works: Work[]; hiddenWorkCount: number; writings: HomeWriting[]; workflowFiles: WorkflowFile[] }

export const getPublicWorkflowFiles = unstable_cache(async (): Promise<WorkflowFile[]> => {
  const supabase = publicClient()
  if (!supabase) return []
  const { data } = await supabase.from('workflow_files').select('*, workflow_file_versions(*)').eq('published', true).order('updated_at', { ascending: false })
  return ((data || []).map(file => ({ ...file, workflow_file_versions: [...(file.workflow_file_versions || [])].sort((a, b) => b.version_number - a.version_number) })) as WorkflowFile[])
}, ['public-workflow-files-v1'], { revalidate: 60 })

const wordCount = (content: unknown) => {
  const blocks = typeof content === 'string' ? (() => { try { return JSON.parse(content) } catch { return [] } })() : content
  return Array.isArray(blocks) ? blocks.reduce((total, block) => total + String(block?.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length, 0) : 0
}

export const getHomepagePortfolioData = unstable_cache(async (): Promise<HomepagePortfolioData> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { profile: null, caseStudies: [], projects: [], works: [], hiddenWorkCount: 0, writings: [], workflowFiles: [] }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [profileResult, caseStudiesResult, projectsResult, worksResult] = await Promise.all([
    supabase.from('profiles').select('*').limit(1).maybeSingle(),
    supabase.from('case_studies').select('id, slug, title, excerpt, thumbnail_url, published, order_index, created_at').order('order_index', { ascending: true }).order('created_at', { ascending: false }).limit(50),
    supabase.from('projects').select('id, title, year, type, link, description, cover_image, created_at').order('created_at', { ascending: false }).limit(30),
    supabase.from('portfolio_works').select('id, title, description, media_url, media_type, thumbnail_url, order_index, created_at, type', { count: 'exact' }).order('created_at', { ascending: false }).limit(50),
  ])
  const works = (worksResult.data as Work[] | null) ?? []
  return {
    profile: (profileResult.data as Profile | null) ?? null,
    caseStudies: (caseStudiesResult.data as CaseStudy[] | null) ?? [],
    projects: (projectsResult.data as Project[] | null) ?? [],
    works,
    hiddenWorkCount: Math.max(0, (worksResult.count || works.length) - works.length),
    writings: [],
    workflowFiles: [],
  }
}, ['homepage-portfolio-data-v6'], { revalidate: 60 })

export const getPublicPortfolioData = unstable_cache(async (): Promise<PortfolioData> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { profile: null, caseStudies: [], projects: [], works: [], writings: [] }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [profileResult, caseStudiesResult, projectsResult, worksResult, writingsResult] = await Promise.all([
    supabase.from('profiles').select('*').limit(1).maybeSingle(),
    supabase.from('case_studies').select('id, slug, title, excerpt, thumbnail_url, published, order_index, created_at').eq('published', true).order('order_index', { ascending: true }).order('created_at', { ascending: false }),
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
}, ['public-portfolio-data'], { revalidate: 300 })
