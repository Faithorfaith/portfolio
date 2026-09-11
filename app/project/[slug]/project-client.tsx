'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import DetailPageHeader from '@/components/detail-page-header'

interface Project {
  id: string
  title: string
  slug: string
  description: string | null
  year: string | null
}

export default function ProjectClient() {
  const params = useParams()
  const slug = params.slug as string
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .single()

        if (data) setProject(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) fetchProject()
  }, [slug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-foreground/50">Loading...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center"><h1 className="text-[18px] mb-3">Project unavailable</h1><a href="/#projects" className="text-sm underline">Back to projects</a><button type="button" className="ml-5 text-sm underline" onClick={() => window.location.reload()}>Retry</button></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto w-full max-w-5xl px-5 pb-20 sm:px-8 md:pb-32">
        <DetailPageHeader title={project.title} eyebrow={project.year} description={project.description} />
        <section className="grid gap-10 border-t border-foreground/10 pt-10 md:grid-cols-[1fr_260px] md:gap-16">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/40">Project overview</p>
            <h2 className="mt-4 max-w-xl text-2xl font-medium tracking-tight text-foreground md:text-3xl">Making the experience clearer, calmer, and more useful.</h2>
            {project.description && <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/60">{project.description}</p>}
          </div>
          <aside className="h-fit rounded-2xl bg-foreground/[0.045] p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-foreground/40">At a glance</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-foreground/45">Year</dt><dd className="text-foreground">{project.year || '—'}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-foreground/45">Status</dt><dd className="inline-flex items-center gap-1.5 text-foreground"><span className="size-1.5 rounded-full bg-emerald-500" /> Published</dd></div>
            </dl>
          </aside>
        </section>
        <div className="mt-16 rounded-3xl border border-dashed border-foreground/15 p-10 text-center md:mt-24 md:p-20">
          <p className="text-sm text-foreground/45">Case study details are being prepared.</p>
          <a href="/#projects" className="mt-4 inline-flex text-xs text-foreground underline underline-offset-4">Explore other projects</a>
        </div>
      </div>
    </main>
  )
}
