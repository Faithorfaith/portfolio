'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchWithCache } from '@/lib/cache-utils'
import { StaggerContainer, StaggerItem } from '@/components/animations/scroll-animations'
import ProgressiveImage from '@/components/progressive-image'

interface CaseStudy {
  id: string
  title: string
  short_description: string | null
  content: string | null
  image_url: string | null
  link: string | null
  order_index: number
  created_at: string
}

export default function CaseStudiesSection() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCaseStudies = async () => {
      try {
        const data = await fetchWithCache(
          'case_studies',
          async () => {
            const supabase = createClient()
            const { data, error } = await supabase
              .from('case_studies')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (error) throw error
            return data || []
          },
          10 * 60 * 1000 // 10 minute cache
        )
        
        setCaseStudies(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCaseStudies()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-foreground/50 animate-pulse">Loading case studies...</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-background">
      <div className="p-6 md:p-8 max-w-2xl">
        {caseStudies.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-foreground/50">No case studies yet</p>
          </div>
        ) : (
          <StaggerContainer delay={0.2}>
            <div className="space-y-8">
              {caseStudies.map((study) => (
                <StaggerItem key={study.id}>
                  <div
                    className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                {/* Cover Image */}
                {study.image_url && (
                  <ProgressiveImage
                    src={study.image_url}
                    alt={study.title}
                    className="w-full h-48 object-cover"
                    containerClassName="w-full overflow-hidden"
                  />
                )}

                <div className="p-6">
                  <h3 className="text-foreground font-medium text-lg mb-2">
                    {study.title}
                  </h3>

                  {study.short_description && (
                    <p className="text-foreground/70 text-sm mb-4">
                      {study.short_description}
                    </p>
                  )}

                  {study.content && (
                    <div className="prose prose-sm max-w-none mb-4 text-foreground/80">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {study.content}
                      </p>
                    </div>
                  )}

                  {study.link && (
                    <a
                      href={study.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-foreground hover:text-foreground/70 transition-colors underline"
                    >
                      Read Full Case Study →
                    </a>
                  )}
                </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        )}
      </div>
    </div>
  )
}
