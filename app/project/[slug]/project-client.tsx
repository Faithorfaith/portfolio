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
        <div className="text-foreground/50">Project not found</div>
      </div>
    )
  }

  return (
    <main className="w-full max-w-4xl mx-auto px-8 py-12 md:py-20">
      <DetailPageHeader
        title={project.title}
        eyebrow={project.year}
        description={project.description}
      />
    </main>
  )
}
