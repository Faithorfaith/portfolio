import 'server-only'

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Profile, CaseStudy } from '@/components/portfolio/profile-section'
import type { Project } from '@/components/portfolio/projects-section'
import type { Work } from '@/components/portfolio/works-gallery'
import type { Writing } from '@/components/portfolio/writing-section'
import type { WorkflowFile } from '@/lib/workflow-files'

type PortfolioData = { profile: Profile | null; caseStudies: CaseStudy[]; projects: Project[]; works: Work[]; writings: Writing[] }

const publicClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null
}

export const getPublicWritings = unstable_cache(async (): Promise<Writing[]> => {
  const supabase = publicClient()
  if (!supabase) return []
  const { data } = await supabase.from('writings').select('*').eq('published', true).order('created_at', { ascending: false })
  return ((data || []).map(writing => ({ ...writing, content: typeof writing.content === 'string' ? JSON.parse(writing.content) : (writing.content || []) })) as Writing[])
}, ['public-writings-v4'], { revalidate: 60 })

export const getPublicWorks = unstable_cache(async (): Promise<Work[]> => {
  const supabase = publicClient()
  if (!supabase) return []
  const { data } = await supabase.from('portfolio_works').select('id, title, description, media_url, media_type, thumbnail_url, order_index, created_at, type').order('created_at', { ascending: false })
  return (data as Work[] | null) ?? []
}, ['public-works-v2'], { revalidate: 300 })

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
  const [profileResult, caseStudiesResult, projectsResult, worksResult, writingsResult, workflowResult] = await Promise.all([
    supabase.from('profiles').select('id, username, full_name, bio, avatar_url, hero_image_1, hero_image_2, hero_image_3, gallery_images, bio_references, contact_email, train_music_url, train_video_1, train_video_2, train_video_3, train_video_4').limit(1).maybeSingle(),
    supabase.from('case_studies').select('id, slug, title, excerpt, thumbnail_url, published, created_at').eq('published', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('projects').select('id, title, year, type, link, description, created_at').order('created_at', { ascending: false }).limit(30),
    supabase.from('portfolio_works').select('id, title, description, media_url, media_type, thumbnail_url, order_index, created_at, type', { count: 'exact' }).order('created_at', { ascending: false }).limit(18),
    supabase.from('writings').select('id, title, slug, excerpt, cover_image, created_at, content').eq('published', true).order('created_at', { ascending: false }).limit(4),
    supabase.from('workflow_files').select('*, workflow_file_versions(*)').eq('published', true).order('updated_at', { ascending: false }).limit(4),
  ])
  const works = (worksResult.data as Work[] | null) ?? []
  return {
    profile: (profileResult.data as Profile | null) ?? null,
    caseStudies: (caseStudiesResult.data as CaseStudy[] | null) ?? [],
    projects: (projectsResult.data as Project[] | null) ?? [],
    works,
    hiddenWorkCount: Math.max(0, (worksResult.count || works.length) - 14),
    writings: (writingsResult.data || []).map(({ content, ...writing }) => ({ ...writing, readingMinutes: Math.max(1, Math.ceil(wordCount(content) / 200)) })) as HomeWriting[],
    workflowFiles: ((workflowResult.data || []).map(file => ({ ...file, workflow_file_versions: [...(file.workflow_file_versions || [])].sort((a, b) => b.version_number - a.version_number) })) as WorkflowFile[]),
  }
}, ['homepage-portfolio-data-v4'], { revalidate: 60 })

export const getPublicPortfolioData = unstable_cache(async (): Promise<PortfolioData> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { profile: null, caseStudies: [], projects: [], works: [], writings: [] }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [profileResult, caseStudiesResult, projectsResult, worksResult, writingsResult] = await Promise.all([
    supabase.from('profiles').select('*').limit(1).maybeSingle(),
    supabase.from('case_studies').select('id, slug, title, excerpt, thumbnail_url, published, created_at').eq('published', true).order('created_at', { ascending: false }),
    supabase.from('projects').select('id, title, year, type, link, description, created_at').order('created_at', { ascending: false }),
    supabase.from('portfolio_works').select('id, title, description, media_url, media_type, thumbnail_url, order_index, created_at, type').order('created_at', { ascending: false }),
    supabase.from('writings').select('*').eq('published', true).order('created_at', { ascending: false }),
  ])

  return {
    profile: (profileResult.data as Profile | null) ?? null,
    caseStudies: (caseStudiesResult.data as CaseStudy[] | null) ?? [],
    projects: (projectsResult.data as Project[] | null) ?? [],
    works: (worksResult.data as Work[] | null) ?? [],
    writings: ((writingsResult.data || []).map((writing) => ({ ...writing, content: typeof writing.content === 'string' ? JSON.parse(writing.content) : (writing.content || []) })) as Writing[]),
  }
}, ['public-portfolio-data'], { revalidate: 300 })
