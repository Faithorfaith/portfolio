import 'server-only'

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Profile, CaseStudy } from '@/components/portfolio/profile-section'
import type { Project } from '@/components/portfolio/projects-section'
import type { Work } from '@/components/portfolio/works-gallery'
import type { Writing } from '@/components/portfolio/writing-section'

type PortfolioData = { profile: Profile | null; caseStudies: CaseStudy[]; projects: Project[]; works: Work[]; writings: Writing[] }

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
    supabase.from('writings').select('id, title, slug, excerpt, cover_image, content, published, created_at').eq('published', true).order('created_at', { ascending: false }),
  ])

  return {
    profile: (profileResult.data as Profile | null) ?? null,
    caseStudies: (caseStudiesResult.data as CaseStudy[] | null) ?? [],
    projects: (projectsResult.data as Project[] | null) ?? [],
    works: (worksResult.data as Work[] | null) ?? [],
    writings: ((writingsResult.data || []).map((writing) => ({ ...writing, content: typeof writing.content === 'string' ? JSON.parse(writing.content) : (writing.content || []) })) as Writing[]),
  }
}, ['public-portfolio-data'], { revalidate: 300 })
