'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import CopyLinkButton from '@/components/copy-link-button'

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
    <main className="w-full max-w-3xl mx-auto px-8 py-16 md:py-24">
      <div className="flex items-center justify-between mb-10">
        <Link href="/" className="text-sm text-foreground/50 hover:text-foreground transition-colors">← Back</Link>
        <CopyLinkButton />
      </div>

      {/* Project Title */}
      <h1 className="text-5xl md:text-6xl font-normal text-foreground mb-4">
        {project.title}
      </h1>

      {project.year && (
        <p className="text-foreground/50 text-lg mb-12">{project.year}</p>
      )}

      {/* Project Description */}
      {project.description && (
        <div className="prose prose-invert max-w-none mb-16">
          <div className="space-y-6">
            {project.description.split('\n\n').map((paragraph, index) => (
              <p
                key={index}
                className="text-lg text-foreground/80 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
