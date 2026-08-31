'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchWithCache } from '@/lib/cache-utils'
import { StaggerContainer, StaggerItem, ParallaxImage } from '@/components/animations/scroll-animations'
import EmptyState from './empty-state'
import Doodles from './doodles'
import ProgressiveImage from '@/components/progressive-image'
import { playFeedback } from '@/lib/interaction-feedback'

interface Work {
  id: string
  title: string
  description: string | null
  media_url: string | null
  media_type: string | null
  thumbnail_url: string | null
  order_index: number
  created_at: string
  type?: string | null
}

export default function WorksGallery({ onSubPageChange }: { onSubPageChange?: (v: boolean) => void }) {
  const [works, setWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const openWork = (work: Work) => {
    playFeedback('tap')
    setSelectedWork(work)
    onSubPageChange?.(true)
    // Tiny delay so the element mounts before we trigger the transition
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)))
  }
  const closeWork = () => {
    setModalVisible(false)
    setTimeout(() => { setSelectedWork(null); onSubPageChange?.(false) }, 200)
  }

  // ESC key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeWork() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedWork])

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const data = await fetchWithCache(
          'portfolio_works',
          async () => {
            const supabase = createClient()
            const { data, error } = await supabase
              .from('portfolio_works')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (error) throw error
            return data || []
          },
          10 * 60 * 1000 // 10 minute cache
        )
        
        setWorks(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorks()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 py-12 md:py-16">
        <div className="animate-pulse space-y-12">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-foreground/6 rounded-full" />
            <div className="h-3 w-2/3 bg-foreground/5 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i}>
                <div className="aspect-[4/3] rounded-xl bg-foreground/5 mb-4" />
                <div className="h-3 w-3/4 bg-foreground/5 rounded-full mb-2" />
                <div className="h-2.5 w-1/2 bg-foreground/4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (works.length === 0) {
    return <EmptyState 
      title="Playground"
      description="Coming soon..."
      doodleVariant={1}
    />
  }

  // Helper to get cover image - use thumbnail, or fallback to media_url if it's an image
  const getCoverImage = (work: Work) => {
    if (work.thumbnail_url) return work.thumbnail_url
    if (work.media_url && work.media_type?.startsWith('image')) return work.media_url
    return null
  }

  // Helper to check if media is video
  const isVideo = (work: Work) => work.media_type?.startsWith('video')

  return (
    <div className="w-full max-w-6xl mx-auto px-8 py-12 md:py-20">
      <Doodles />

      <div className="flex justify-center">
        <div className="max-w-4xl w-full">
          {/* Section Header */}
          <div className="mb-14 max-w-xl">
            <h2 className="text-3xl md:text-4xl tracking-[-0.035em] font-medium text-foreground mb-4">Playground</h2>
            <p className="text-foreground/55 leading-relaxed">
              A collection of experiments, projects, and things I&apos;ve built. Each piece represents a learning opportunity or a creative exploration.
            </p>
          </div>

          {/* Grid Layout - 2 cols */}
          <StaggerContainer delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
              {works.map((work) => {
                const coverImage = getCoverImage(work)
                
                return (
                  <StaggerItem key={work.id}>
                    <button
                      onClick={() => openWork(work)}
                      className="group text-left w-full focus-visible:outline-offset-6"
                    >
                      {/* Card */}
                      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-4 bg-foreground/5 border border-foreground/8 group-hover:border-foreground/22 transition-colors duration-300">
                        {coverImage ? (
                          <ProgressiveImage
                            src={coverImage}
                            alt={work.title}
                            fill
                            className="transition-opacity duration-500 ease-out"
                            containerClassName="w-full h-full"
                          />
                        ) : isVideo(work) && work.media_url ? (
                          <video
                            src={work.media_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/20">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="relative pr-7">
                        {work.type && (
                          <p className="text-foreground/35 text-xs mb-2">
                            {work.type}
                          </p>
                        )}
                        <h3 className="text-foreground font-medium transition-colors line-clamp-1">
                          {work.title}
                        </h3>
                        {work.description && (
                          <p className="text-foreground/45 text-sm mt-1 line-clamp-2 leading-relaxed">
                            {work.description}
                          </p>
                        )}
                        <span className="absolute right-0 top-0 text-foreground/25 group-hover:text-foreground/65 group-hover:translate-x-0.5 transition-all" aria-hidden="true">↗</span>
                      </div>
                    </button>
                  </StaggerItem>
                )
              })}
            </div>
          </StaggerContainer>
        </div>
      </div>

      {/* Modal - Work Detail */}
      {selectedWork && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-md"
          style={{
            background: `rgba(0,0,0,${modalVisible ? 0.32 : 0})`,
            transition: 'background 0.2s ease',
          }}
          onClick={closeWork}
        >
          <div
            className="bg-background rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden relative shadow-2xl shadow-black/10"
            onClick={(e) => e.stopPropagation()}
            style={{
              border: '0.5px solid rgba(0,0,0,0.1)',
              transform: modalVisible ? 'translateY(0)' : 'translateY(10px)',
              opacity: modalVisible ? 1 : 0,
              transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease',
            }}
          >
            <button
              onClick={closeWork}
              className="absolute top-4 right-4 z-10 size-9 flex items-center justify-center bg-background/85 backdrop-blur-md hover:bg-background rounded-full transition-colors"
              aria-label="Close project"
              style={{ border: '0.5px solid rgba(0,0,0,0.1)' }}
            >
              <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col md:flex-row h-full">
              {/* Left - Media (2/3) */}
              <div className="md:w-2/3 bg-foreground/[0.035] flex items-center justify-center p-4 md:p-8 max-h-[50vh] md:max-h-[80vh] overflow-hidden">
                {selectedWork.media_url ? (
                  selectedWork.media_type?.startsWith('image') ? (
                    <ProgressiveImage
                      src={selectedWork.media_url}
                      alt={selectedWork.title}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      containerClassName="max-w-full max-h-full rounded-lg"
                    />
                  ) : (
                    <video
                      src={selectedWork.media_url}
                      controls
                      className="max-w-full max-h-full rounded-lg"
                    />
                  )
                ) : getCoverImage(selectedWork) ? (
                  <ProgressiveImage
                    src={getCoverImage(selectedWork)!}
                    alt={selectedWork.title}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    containerClassName="max-w-full max-h-full rounded-lg"
                  />
                ) : (
                  <div className="text-foreground/20 text-center">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No media</p>
                  </div>
                )}
              </div>

              {/* Right - Details (1/3) */}
              <div className="md:w-1/3 p-6 md:p-8 flex flex-col overflow-y-auto">
                {/* Type */}
                {selectedWork.type && (
                  <span className="text-foreground/35 text-xs mb-3">
                    {selectedWork.type}
                  </span>
                )}

                {/* Title */}
                <h2 className="text-2xl font-medium tracking-[-0.025em] text-foreground mb-4">
                  {selectedWork.title}
                </h2>

                {/* Description */}
                {selectedWork.description && (
                  <p className="text-foreground/55 leading-relaxed mb-6">
                    {selectedWork.description}
                  </p>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Date */}
                <div className="pt-6 mt-auto" style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
                  <span className="text-foreground/40 text-xs">
                    {new Date(selectedWork.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
