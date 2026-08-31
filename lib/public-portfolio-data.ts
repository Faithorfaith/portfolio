import 'server-only'

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Profile, CaseStudy } from '@/components/portfolio/profile-section'
import type { Project } from '@/components/portfolio/projects-section'

type PortfolioData = { profile: Profile | null; caseStudies: CaseStudy[]; projects: Project[] }

export const getPublicPortfolioData = unstable_cache(async (): Promise<PortfolioData> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { profile: null, caseStudies: [], projects: [] }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [profileResult, caseStudiesResult, projectsResult] = await Promise.all([
    supabase.from('profiles').select('*').limit(1).maybeSingle(),
    supabase.from('case_studies').select('id, title, excerpt, thumbnail_url, published, created_at').eq('published', true).order('created_at', { ascending: false }),
    supabase.from('projects').select('id, title, year, type, link, description, created_at').order('created_at', { ascending: false }),
  ])

  return {
    profile: (profileResult.data as Profile | null) ?? null,
    caseStudies: (caseStudiesResult.data as CaseStudy[] | null) ?? [],
    projects: (projectsResult.data as Project[] | null) ?? [],
  }
}, ['public-portfolio-data'], { revalidate: 300 })
